'use client';

import { useState } from 'react';

import type { Warehouse, WarehouseFormInput } from '@/types/warehouse';

type WarehouseFormProps = {
  initialValues?: Partial<Warehouse>;
  submitLabel: string;
  onSubmit: (values: WarehouseFormInput) => Promise<void>;
};

type FieldErrors = {
  name?: string;
  code?: string;
  note?: string;
  form?: string;
};

function validate(values: WarehouseFormInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = 'Warehouse name must be at least 2 characters.';
  }

  if (values.code && values.code.trim().length > 30) {
    errors.code = 'Code cannot be longer than 30 characters.';
  }

  if (values.note && values.note.trim().length > 500) {
    errors.note = 'Note cannot be longer than 500 characters.';
  }

  return errors;
}

export function WarehouseForm({
  initialValues,
  submitLabel,
  onSubmit,
}: WarehouseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: WarehouseFormInput = {
      name: name.trim(),
      code: code.trim() || undefined,
      note: note.trim() || undefined,
      isActive,
    };

    const validationErrors = validate(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Failed to save warehouse.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor="name">
            Warehouse name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="Main warehouse"
          />
          {errors.name ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.name}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="WH-01"
          />
          {errors.code ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.code}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          placeholder="Optional note"
        />
        {errors.note ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.note}</p> : null}
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-[var(--text)]">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4"
        />
        Active warehouse
      </label>

      {errors.form ? <p className="text-sm text-[var(--danger)]">{errors.form}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

