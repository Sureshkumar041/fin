import {
  Check,
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
import { Category } from './category.entity';
import { ExpenseParticipant } from './expense-participant.entity';
import { decimalToNumber } from '../utils/decimal-transformer';

export const SPLIT_METHODS = ['EQUAL', 'CUSTOM', 'PERCENTAGE'] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

@Entity({ name: 'expenses' })
@Check('chk_expenses_amount_positive', '"amount" > 0')
@Check('chk_expenses_split_method', `"split_method" IN ('EQUAL', 'CUSTOM', 'PERCENTAGE')`)
// Main query: "this user's expenses, filtered/sorted by date".
@Index('idx_expenses_user_date', ['userId', 'expenseDate'])
// "This category's expenses in a date range". A category belongs to exactly one
// user, so category_id alone narrows to that user. Postgres doesn't index
// foreign keys automatically; this index also serves the RESTRICT check when a
// category is deleted.
@Index('idx_expenses_category_date', ['categoryId', 'expenseDate'])
export class Expense {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_expenses' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  // NUMERIC, never FLOAT, for money: exact decimal arithmetic in SQL.
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalToNumber })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  // Calendar date only (no time/timezone). Comes back as 'YYYY-MM-DD'.
  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  // NULL = a normal personal expense. Otherwise the expense is split with the
  // rows in `participants`; the owner's share is amount minus their shares.
  // (A CHECK passes on NULL, so personal expenses need no special case.)
  @Column({ name: 'split_method', type: 'varchar', length: 20, nullable: true })
  splitMethod: SplitMethod | null;

  // Deleting a user deletes their expenses.
  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_expenses_user' })
  user: User;

  // A category that still has expenses cannot be deleted.
  @ManyToOne(() => Category, (category) => category.expenses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'fk_expenses_category' })
  category: Category;

  // Empty for personal expenses.
  @OneToMany(() => ExpenseParticipant, (participant) => participant.expense)
  participants: ExpenseParticipant[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
