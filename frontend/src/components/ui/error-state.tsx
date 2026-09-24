import { AlertIcon } from '@/components/icons';
import { Button } from './button';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function ErrorState({ title = "Couldn't load this section", message, onRetry, retrying }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertIcon />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {message && <p className="max-w-xs text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
