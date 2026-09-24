import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

// Postgres returns NUMERIC as a string to avoid precision loss. Two decimal
// places fit safely in a JS number, so convert for convenience.
const decimalToNumber = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'expenses' })
@Check('chk_expenses_amount_positive', '"amount" > 0')
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

  // Deleting a user deletes their expenses.
  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_expenses_user' })
  user: User;

  // A category that still has expenses cannot be deleted.
  @ManyToOne(() => Category, (category) => category.expenses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'fk_expenses_category' })
  category: Category;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
