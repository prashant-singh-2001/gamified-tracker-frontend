import { useId, useState, type FormEvent } from 'react';
import { WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api/errors';

type NaturalInputProps = {
  onSubmit: (text: string) => void;
  pending: boolean;
  error: unknown;
  /** Text to start with, e.g. a sentence typed on Home and handed to the sheet. */
  initialText?: string;
  placeholder?: string;
};

/** "Tell us what you did" — the faster path. Submitting only previews; nothing is saved yet. */
export function NaturalInput({
  onSubmit,
  pending,
  error,
  initialText = '',
  placeholder = 'Studied Spring Boot for 90 min this morning',
}: NaturalInputProps) {
  const id = useId();
  const [text, setText] = useState(initialText);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-soft">
        Tell us what you did
      </label>
      <textarea
        id={id}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="resize-none rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-text placeholder:text-faint"
      />
      {error != null && (
        <p role="alert" className="text-sm text-danger">
          {getErrorMessage(error)}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={pending} disabled={!text.trim()}>
        <WandSparkles className="size-4" aria-hidden="true" />
        Understand it
      </Button>
    </form>
  );
}
