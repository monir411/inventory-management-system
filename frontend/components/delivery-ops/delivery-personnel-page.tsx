'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToast } from '@/components/ui/toast-provider';
import {
  createDeliveryPerson,
  deleteDeliveryPerson,
  getDeliveryPeople,
  updateDeliveryPerson,
} from '@/lib/api/delivery-ops';
import type { DeliveryPerson } from '@/types/api';

export function DeliveryPersonnelPage() {
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [personnel, setPersonnel] = useState<DeliveryPerson[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);

  const fetchPersonnel = async () => {
    try {
      setIsLoading(true);
      const data = await getDeliveryPeople(true); // Include inactive
      setPersonnel(data);
    } catch (error) {
      showErrorToast('Failed to load delivery personnel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleEdit = (person: DeliveryPerson) => {
    setEditingPerson(person);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPerson(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery person?')) return;
    try {
      const response = await deleteDeliveryPerson(id);
      showSuccessToast(response.message || 'Delivery person deleted successfully');
      fetchPersonnel();
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to delete delivery person');
    }
  };

  const filteredPersonnel = personnel.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">
            Logistics Management
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Delivery Personnel
          </h1>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add Delivery Man
        </button>
      </div>

      <PageCard
        title="Active & Inactive Staff"
        description="Manage the team that handles the distribution routes."
        action={
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm"
            />
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Name & Contact</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                    Loading personnel...
                  </td>
                </tr>
              ) : filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <StateMessage
                      title="No delivery personnel found"
                      description="Add a delivery man to start assigning dispatch batches."
                      icon={<Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />}
                    />
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((person) => (
                  <tr key={person.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{person.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {person.phone} {person.email ? `· ${person.email}` : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{person.address || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          person.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {person.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(person)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      {isModalOpen && (
        <PersonnelFormModal
          person={editingPerson}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPersonnel();
          }}
        />
      )}
    </div>
  );
}

function PersonnelFormModal({
  person,
  onClose,
  onSuccess,
}: {
  person: DeliveryPerson | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: person?.name || '',
    phone: person?.phone || '',
    email: person?.email || '',
    address: person?.address || '',
    notes: person?.notes || '',
    isActive: person ? person.isActive : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (person) {
        await updateDeliveryPerson(person.id, formData);
        showSuccessToast('Delivery person updated successfully');
      } else {
        await createDeliveryPerson(formData);
        showSuccessToast('Delivery person added successfully');
      }
      onSuccess();
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to save delivery person');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-black text-slate-900">
            {person ? 'Edit Delivery Man' : 'Add Delivery Man'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Address
              </label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-600"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Active Status</p>
                <p className="text-xs font-medium text-slate-500">
                  Allow assigning orders and batches to this delivery man.
                </p>
              </div>
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black uppercase tracking-[0.15em] text-white transition hover:bg-cyan-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
