import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Expense } from './expense.entity';

@Entity({ name: 'categories' })
// A user can't have two categories with the same name. This index starts with
// user_id, so it also serves "all categories for a user" queries.
@Unique('uq_categories_user_name', ['userId', 'name'])
export class Category {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_categories' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  // Deleting a user deletes their categories.
  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_categories_user' })
  user: User;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
