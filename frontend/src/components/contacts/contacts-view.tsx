'use client';

import { useRef, useState } from 'react';
import {
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  Panel,
  Skeleton,
} from '@/components/ui';
import { UsersIcon } from '@/components/icons';
import { useApi } from '@/hooks/use-api';
import { useNotice } from '@/hooks/use-notice';
import { contactsApi, toFormErrors } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { Contact } from '@/types';
import { ContactForm } from './contact-form';
import { ContactList } from './contact-list';

type FormState = { mode: 'create' } | { mode: 'edit'; contact: Contact } | null;

export function ContactsView() {
  const list = useApi(() => contactsApi.list());
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInFlight = useRef(false);
  const { notice, showNotice } = useNotice();

  const contacts = list.data ?? [];
  // A contact who still owes you is on a split, so the API would refuse (409): explain up front.
  const deleteBlocked = toDelete !== null && toDelete.owesYou > 0;

  async function handleSave(name: string) {
    if (form?.mode === 'edit') {
      const current = form.contact;
      // Unchanged name: nothing to save.
      if (name !== current.name) {
        const updated = await contactsApi.update(current.id, { name });
        // Replace in place with the API's version; the order stays as it is.
        list.setData((data) => data?.map((c) => (c.id === updated.id ? updated : c)));
        showNotice(`Renamed to “${updated.name}”.`);
      }
    } else {
      const created = await contactsApi.create({ name });
      showNotice(`Contact “${created.name}” added.`);
      // The API decides the order (by name), so load the list rather than sort it here.
      list.reload();
    }
    setForm(null);
  }

  async function handleDelete() {
    if (!toDelete || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await contactsApi.remove(toDelete.id);
      const removed = toDelete;
      list.setData((data) => data?.filter((c) => c.id !== removed.id));
      showNotice(`Contact “${removed.name}” deleted.`);
      setToDelete(null);
    } catch (err) {
      // e.g. 409 "Contact is part of split expenses": the contact stays.
      setDeleteError(toFormErrors(err).message);
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  }

  const openCreate = () => setForm({ mode: 'create' });

  return (
    <>
      <PageHeader
        title="Contacts"
        description="People you split expenses with. They don’t need an account."
        actions={
          <Button onClick={openCreate} disabled={list.loading}>
            Add contact
          </Button>
        }
      />
      <Notice message={notice} />

      <Panel title="Your contacts" description={list.data ? `${contacts.length} total` : undefined}>
        {list.loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : list.error && !list.data ? (
          <ErrorState message={list.error.message} onRetry={list.reload} retrying={list.refreshing} />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title="No contacts yet"
            description="Add people you regularly split expenses with to make split expenses easier to create."
            action={
              <Button size="sm" onClick={openCreate}>
                Add contact
              </Button>
            }
          />
        ) : (
          <div className={list.refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ContactList
              contacts={contacts}
              onEdit={(contact) => setForm({ mode: 'edit', contact })}
              onDelete={(contact) => {
                setDeleteError(null);
                setToDelete(contact);
              }}
            />
          </div>
        )}
      </Panel>

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit contact' : 'Add contact'}>
        {form && (
          <ContactForm
            contact={form.mode === 'edit' ? form.contact : undefined}
            existing={contacts}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Dialog>

      {deleteBlocked && toDelete ? (
        <Dialog open onClose={() => setToDelete(null)} title={`Can’t delete “${toDelete.name}”`}>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{toDelete.name}</span> still owes you{' '}
            <span className="font-medium text-foreground">{formatMoney(toDelete.owesYou)}</span> on split expenses.
            A contact who is part of a split can’t be deleted: remove them from those splits, or delete those
            expenses, first.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Close
            </Button>
          </div>
        </Dialog>
      ) : (
        <ConfirmDialog
          open={toDelete !== null}
          title={toDelete ? `Delete ${toDelete.name}?` : 'Delete contact?'}
          confirmLabel="Delete contact"
          loading={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        >
          {toDelete && (
            <p>
              <span className="font-medium text-foreground">{toDelete.name}</span> will be removed from your contacts.
              Contacts who are part of a split expense (even one that’s fully paid back) can’t be deleted.
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
