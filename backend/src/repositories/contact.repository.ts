import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Contact } from '../entities/contact.entity';

const repo = () => AppDataSource.getRepository(Contact);

// Postgres returns SUM(numeric) as a string; the service converts it.
export type ContactWithOwesYouRow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  owesYou: string;
};

// Total still PENDING for one contact, counting only the user's own expenses.
// Served by idx_expense_participants_contact_status.
const PENDING_TOTAL_SQL = `COALESCE((
  SELECT SUM(p.share_amount)
  FROM expense_participants p
  JOIN expenses e ON e.id = p.expense_id
  WHERE p.contact_id = contact.id AND p.status = 'PENDING' AND e.user_id = :userId
), 0)`;

// Every query is scoped by userId, so one user can never read or change
// another user's contacts, even with a valid contact id.
export const contactRepository = {
  // The total is summed in SQL, so participants are never loaded.
  findAllByUserWithOwesYou(userId: string) {
    return repo()
      .createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.name', 'name')
      .addSelect('contact.createdAt', 'createdAt')
      .addSelect('contact.updatedAt', 'updatedAt')
      .addSelect(PENDING_TOTAL_SQL, 'owesYou')
      .where('contact.userId = :userId', { userId })
      .orderBy('contact.name', 'ASC')
      .getRawMany<ContactWithOwesYouRow>();
  },

  async getOwesYou(id: string, userId: string): Promise<string> {
    const row = await repo()
      .createQueryBuilder('contact')
      .select(PENDING_TOTAL_SQL, 'owesYou')
      .where('contact.id = :id AND contact.userId = :userId', { id, userId })
      .getRawOne<{ owesYou: string }>();
    return row?.owesYou ?? '0';
  },

  findByIdForUser(id: string, userId: string) {
    return repo().findOneBy({ id, userId });
  },

  // Which of these ids are the user's own contacts. Ids of other users'
  // contacts are simply not returned.
  async findOwnedIds(ids: string[], userId: string): Promise<Set<string>> {
    const rows = await repo().find({ select: { id: true }, where: { id: In(ids), userId } });
    return new Set(rows.map((row) => row.id));
  },

  // Case-insensitive, so "Rahul" and "rahul" count as the same name.
  findByNameForUser(name: string, userId: string) {
    return repo()
      .createQueryBuilder('contact')
      .where('contact.userId = :userId', { userId })
      .andWhere('LOWER(contact.name) = LOWER(:name)', { name })
      .getOne();
  },

  create(data: { userId: string; name: string }) {
    return repo().save(repo().create(data));
  },

  save(contact: Contact) {
    return repo().save(contact);
  },

  remove(contact: Contact) {
    return repo().remove(contact);
  },
};
