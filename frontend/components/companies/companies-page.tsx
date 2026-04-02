'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createCompany,
  getCompanies,
  updateCompany,
} from '@/lib/api/companies';
import type { Company } from '@/types/api';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';

const initialFormState = {
  name: '',
  code: '',
  address: '',
  phone: '',
  isActive: true,
};

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load companies',
    tone: 'error',
  });
  useToastNotification({
    message: formError,
    title: 'Could not save company',
    tone: 'error',
  });
  useToastNotification({
    message: successMessage,
    title: 'Saved',
    tone: 'success',
  });

  async function loadCompanies() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCompanies();
      setCompanies(data);
      setSelectedCompanyId((current) => current ?? data[0]?.id ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load companies.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (editingCompany) {
      setFormState({
        name: editingCompany.name,
        code: editingCompany.code,
        address: editingCompany.address,
        phone: editingCompany.phone,
        isActive: editingCompany.isActive,
      });
      return;
    }

    setFormState(initialFormState);
  }, [editingCompany]);

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      setIsSaving(true);

      const payload = {
        name: formState.name,
        code: formState.code,
        address: formState.address,
        phone: formState.phone,
        isActive: formState.isActive,
      };

      if (editingCompany) {
        await updateCompany(editingCompany.id, payload);
        setSuccessMessage(`Company "${payload.name}" updated successfully.`);
      } else {
        const company = await createCompany(payload);
        setSelectedCompanyId(company.id);
        setSuccessMessage(`Company "${payload.name}" created successfully.`);
      }

      setEditingCompany(null);
      await loadCompanies();
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Failed to save company.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
      <PageCard
        title="Companies"
        description="Browse, create, and update the companies that own products and stock in this phase."
      >
        {isLoading ? <LoadingBlock label="Loading companies..." /> : null}
        {!isLoading && !error ? (
          <div className="space-y-3">
            {companies.map((company) => {
              const isSelected = company.id === selectedCompanyId;

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{company.name}</h4>
                      <p className="mt-1 text-sm opacity-80">Code: {company.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          company.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                          isSelected
                            ? 'border-white/30 text-white'
                            : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        Edit below
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm opacity-80">{company.address}</p>
                  <p className="mt-2 text-sm opacity-80">Phone: {company.phone}</p>
                </button>
              );
            })}
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title="Selected Company"
        description="Use this view to confirm the company context before testing products and stock."
      >
        {selectedCompany ? (
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <p className="text-sm text-slate-500">Company name</p>
              <p className="text-lg font-semibold text-slate-900">
                {selectedCompany.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Code</p>
              <p className="text-base font-medium text-slate-900">
                {selectedCompany.code}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="text-base text-slate-900">{selectedCompany.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="text-base text-slate-900">{selectedCompany.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-base font-medium text-slate-900">
                {selectedCompany.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingCompany(selectedCompany)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Edit this company
            </button>
          </div>
        ) : (
          <StateMessage
            title="No company selected"
            description="Pick a company from the list to inspect its details."
          />
        )}
      </PageCard>

      <PageCard
        title={editingCompany ? 'Edit Company' : 'Add Company'}
        description="Create your real company master data here, or update an existing company."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Company name</span>
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Company name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Company code</span>
            <input
              value={formState.code}
              onChange={(event) =>
                setFormState((current) => ({ ...current, code: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Unique company code"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Address</span>
            <textarea
              value={formState.address}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Company address"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, phone: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Company phone"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Company is active
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingCompany ? 'Update company' : 'Add company'}
            </button>
            {editingCompany ? (
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </PageCard>
    </div>
  );
}
