import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { Expense } from './expense.entity';
import { decimalToNumber } from '../utils/decimal-transformer';

export const SETTLEMENT_STATUSES = ['PENDING', 'PAID'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

// One other person's share of a split expense. The expense owner (who paid
// the bill) has no row here: their share is expense.amount minus these shares.
@Entity({ name: 'expense_participants' })
// The same person can't appear twice on one expense. Starts with expense_id,
// so it also serves "participants of this expense" lookups.
@Unique('uq_expense_participants_expense_contact', ['expenseId', 'contactId'])
// "What does this contact owe me": filters by contact, then status. Also
// serves the RESTRICT check when a contact is deleted.
@Index('idx_expense_participants_contact_status', ['contactId', 'status'])
@Check('chk_expense_participants_share_positive', '"share_amount" > 0')
@Check('chk_expense_participants_percentage', '"percentage" IS NULL OR ("percentage" > 0 AND "percentage" <= 100)')
@Check('chk_expense_participants_status', `"status" IN ('PENDING', 'PAID')`)
// PAID always has a settlement time; PENDING never does.
@Check('chk_expense_participants_settled_at', `("status" = 'PAID') = ("settled_at" IS NOT NULL)`)
export class ExpenseParticipant {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_expense_participants' })
  id: string;

  @Column({ name: 'expense_id', type: 'uuid' })
  expenseId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'share_amount', type: 'numeric', precision: 12, scale: 2, transformer: decimalToNumber })
  shareAmount: number;

  // Only set for PERCENTAGE splits, so shares can be recalculated if the amount changes.
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: decimalToNumber })
  percentage: number | null;

  @Column({ type: 'varchar', length: 10, default: 'PENDING' })
  status: SettlementStatus;

  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true })
  settledAt: Date | null;

  // Deleting an expense deletes its participants.
  @ManyToOne(() => Expense, (expense) => expense.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id', foreignKeyConstraintName: 'fk_expense_participants_expense' })
  expense: Expense;

  // A contact who is on any split cannot be deleted.
  @ManyToOne(() => Contact, (contact) => contact.participants, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contact_id', foreignKeyConstraintName: 'fk_expense_participants_contact' })
  contact: Contact;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
