import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import type { Contact } from '@/types';

type ContactListProps = {
  /** In the order the API returned them (by name). */
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

export function ContactList({ contacts, onEdit, onDelete }: ContactListProps) {
  return (
    <ul className="divide-y divide-border">
      {contacts.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground" title={c.name}>
              {c.name}
            </p>
            {/* owesYou comes from the API (their PENDING shares); it's never worked out here. */}
            <p className="text-xs tabular-nums">
              {c.owesYou > 0 ? (
                <span className="font-medium text-foreground">{formatMoney(c.owesYou)} owed</span>
              ) : (
                <span className="text-muted-foreground">Nothing owed</span>
              )}
            </p>
          </div>
          <div className="-mr-3 flex shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>
              Edit
            </Button>
            <Button variant="danger-ghost" size="sm" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
