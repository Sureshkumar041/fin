import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';

// Called lazily so the repository is only built after the DataSource is initialized.
const repo = () => AppDataSource.getRepository(User);

export const userRepository = {
  findById(id: string) {
    return repo().findOneBy({ id });
  },

  // passwordHash has select: false on the entity, so it must be requested explicitly.
  findByEmailWithPassword(email: string) {
    return repo()
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return repo().save(repo().create(data));
  },
};
