import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/category.entity';

const repo = () => AppDataSource.getRepository(Category);

// Every query is scoped by userId, so one user can never read or change
// another user's categories, even with a valid category id.
export const categoryRepository = {
  findAllByUser(userId: string) {
    return repo().find({ where: { userId }, order: { name: 'ASC' } });
  },

  findByIdForUser(id: string, userId: string) {
    return repo().findOneBy({ id, userId });
  },

  // Case-insensitive, so "Food" and "food" count as the same name.
  findByNameForUser(name: string, userId: string) {
    return repo()
      .createQueryBuilder('category')
      .where('category.userId = :userId', { userId })
      .andWhere('LOWER(category.name) = LOWER(:name)', { name })
      .getOne();
  },

  create(data: { userId: string; name: string }) {
    return repo().save(repo().create(data));
  },

  save(category: Category) {
    return repo().save(category);
  },

  remove(category: Category) {
    return repo().remove(category);
  },
};
