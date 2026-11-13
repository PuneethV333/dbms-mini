"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AlertDto,
  AlertListItemDto,
  AlertStatusUpdate,
  TriggerAlertInput,
  UpdateLocationInput,
} from "@/lib/types";
import { apiClient } from "./api";

export const alertsQueryKey = ["alerts"] as const;

export function useTriggerAlert() {
  return useMutation({
    mutationFn: async (input: TriggerAlertInput): Promise<AlertDto> => {
      const response = await apiClient.post("/alerts/trigger", input);
      return response.data as AlertDto;
    },
  });
}

export function useAlert(id: string | null) {
  return useQuery<AlertDto>({
    queryKey: ["alert", id],
    enabled: Boolean(id),
    queryFn: async () => (await apiClient.get(`/alerts/${id}`)).data as AlertDto,
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== "resolved" ? 15_000 : false,
    retry: false,
  });
}

export function useAlertList() {
  return useQuery<AlertListItemDto[]>({
    queryKey: alertsQueryKey,
    queryFn: async () => (await apiClient.get("/alerts")).data as AlertListItemDto[],
  });
}

export function useUpdateAlertStatus() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AlertStatusUpdate }) => {
      const response = await apiClient.patch(`/alerts/${id}/status`, { status });
      return response.data as AlertDto;
    },
  });
}

/** REST location ping used by the trigger client every 12s. */
export async function sendLocationViaREST(
  alertId: string,
  input: UpdateLocationInput,
): Promise<void> {
  await apiClient.post(`/alerts/${alertId}/location`, input);
}
