import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MyPackageDTO, PackageDTO, PackageInput, PanelCustomerPackageDTO, PanelReportDTO, ReturnReminderDTO, BusinessSettingsInput } from '@conecta/shared';
import { api } from './api';
import { useAuth } from './auth';

// ── Tutor ──
export function useMyPackages() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['my-packages'], queryFn: () => api.get<MyPackageDTO[]>('/me/packages'), enabled: !!user, staleTime: 30_000 });
}

export function useRequestPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { packageId: string; petId?: string | null }) => api.post<{ id: string }>('/me/packages', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-packages'] }),
  });
}

export function useCancelMyPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/me/packages/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-packages'] }),
  });
}

export function useReminders() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['reminders'], queryFn: () => api.get<ReturnReminderDTO[]>('/me/reminders'), enabled: !!user, staleTime: 5 * 60_000 });
}

// ── Painel ──
const base = (id: string) => `/panel/businesses/${id}`;

export function usePanelPackages(businessId: string) {
  return useQuery({ queryKey: ['panel', businessId, 'packages'], queryFn: () => api.get<PackageDTO[]>(`${base(businessId)}/packages`) });
}

export function useSavePackage(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: PackageInput }) =>
      id ? api.put(`${base(businessId)}/packages/${id}`, data) : api.post(`${base(businessId)}/packages`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panel', businessId, 'packages'] }),
  });
}

export function useRemovePackage(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${base(businessId)}/packages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panel', businessId, 'packages'] }),
  });
}

export function useCustomerPackages(businessId: string) {
  return useQuery({ queryKey: ['panel', businessId, 'customer-packages'], queryFn: () => api.get<PanelCustomerPackageDTO[]>(`${base(businessId)}/customer-packages`) });
}

export function useCustomerPackageAction(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'cancel' }) => api.post(`${base(businessId)}/customer-packages/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panel', businessId, 'customer-packages'] }),
  });
}

export function useSaveSettings(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: BusinessSettingsInput) => api.put<{ pixKey: string | null; loyaltyEvery: number | null }>(`${base(businessId)}/settings`, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panel', businessId] }),
  });
}

export function useDepositPaid(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.post(`${base(businessId)}/bookings/${bookingId}/deposit-paid`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panel', businessId] }),
  });
}

export function useReport(businessId: string, month: string) {
  return useQuery({ queryKey: ['panel', businessId, 'report', month], queryFn: () => api.get<PanelReportDTO>(`${base(businessId)}/reports?month=${month}`) });
}
