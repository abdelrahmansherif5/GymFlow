import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDays,
  useCreateDay,
  useUpdateDay,
  useDeleteDay,
  useGetMachines,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  useGetSettings,
  useUpdateSettings,
  getGetDaysQueryKey,
  getGetMachinesQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";

// ==========================================
// DAYS HOOKS
// ==========================================
export function useDaysList() {
  return useGetDays();
}

export function useDayCreate() {
  const queryClient = useQueryClient();
  return useCreateDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
}

export function useDayUpdate() {
  const queryClient = useQueryClient();
  return useUpdateDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
}

export function useDayDelete() {
  const queryClient = useQueryClient();
  return useDeleteDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
}

// ==========================================
// MACHINES HOOKS
// ==========================================
export function useMachinesList() {
  return useGetMachines();
}

export function useMachineCreate() {
  const queryClient = useQueryClient();
  return useCreateMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
}

export function useMachineUpdate() {
  const queryClient = useQueryClient();
  return useUpdateMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
}

export function useMachineDelete() {
  const queryClient = useQueryClient();
  return useDeleteMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
}

// ==========================================
// SETTINGS HOOKS
// ==========================================
export function useSettings() {
  return useGetSettings();
}

export function useSettingsUpdate() {
  const queryClient = useQueryClient();
  return useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
    },
  });
}
