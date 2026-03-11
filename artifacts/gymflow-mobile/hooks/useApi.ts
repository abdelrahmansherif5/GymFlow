import { useQueryClient } from '@tanstack/react-query';
import {
  useGetDays,
  useCreateDay,
  useUpdateDay,
  useDeleteDay,
  getGetDaysQueryKey,
  useGetMachines,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  getGetMachinesQueryKey,
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from '@workspace/api-client-react';

export const useDaysList = useGetDays;

export const useDayCreate = () => {
  const queryClient = useQueryClient();
  return useCreateDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
};

export const useDayUpdate = () => {
  const queryClient = useQueryClient();
  return useUpdateDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
};

export const useDayDelete = () => {
  const queryClient = useQueryClient();
  return useDeleteDay({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      },
    },
  });
};

export const useMachinesList = useGetMachines;

export const useMachineCreate = () => {
  const queryClient = useQueryClient();
  return useCreateMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
};

export const useMachineUpdate = () => {
  const queryClient = useQueryClient();
  return useUpdateMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
};

export const useMachineDelete = () => {
  const queryClient = useQueryClient();
  return useDeleteMachine({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      },
    },
  });
};

export const useSettings = useGetSettings;

export const useSettingsUpdate = () => {
  const queryClient = useQueryClient();
  return useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
    },
  });
};
