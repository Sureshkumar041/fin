import { Badge, type BadgeVariant } from '@/components/ui';
import { SETTLEMENT_STATUS_LABELS, SPLIT_METHOD_LABELS } from '@/lib/split';
import type { SettlementStatus, SplitMethod } from '@/types';

// Each split method has its own colour; settlement uses the status colours.
// The label is always written out, so nothing depends on the colour.
const METHOD_VARIANT: Record<SplitMethod, BadgeVariant> = { EQUAL: 'cyan', CUSTOM: 'violet', PERCENTAGE: 'pink' };
const STATUS_VARIANT: Record<SettlementStatus, BadgeVariant> = { PENDING: 'warning', PAID: 'success' };

export const SplitMethodBadge = ({ method }: { method: SplitMethod }) => (
  <Badge variant={METHOD_VARIANT[method]}>{SPLIT_METHOD_LABELS[method]}</Badge>
);

export const SettlementBadge = ({ status }: { status: SettlementStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{SETTLEMENT_STATUS_LABELS[status]}</Badge>
);
