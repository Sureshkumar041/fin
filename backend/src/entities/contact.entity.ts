import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ExpenseParticipant } from './expense-participant.entity';

// A person the user splits expenses with. Not an app account: just a name
// owned by one user, like a category.
@Entity({ name: 'contacts' })
// Unique per user, ignoring case ("Rahul" and "rahul" are the same person).
// It's an expression index, which TypeORM can't describe, so it is created in
// the migration and synchronize: false keeps migration:generate from dropping it.
// It starts with user_id, so it also serves "all contacts for a user" queries.
@Index('uq_contacts_user_name', { synchronize: false })
export class Contact {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_contacts' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  // Deleting a user deletes their contacts.
  @ManyToOne(() => User, (user) => user.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_contacts_user' })
  user: User;

  @OneToMany(() => ExpenseParticipant, (participant) => participant.contact)
  participants: ExpenseParticipant[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
