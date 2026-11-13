"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { AlertTrackingDto } from "@/lib/types";
import { apiClient } from "./api";

export function useTracking(token: string | undefined) {
  return useQuery<AlertTrackingDto>({
    queryKey: ["tracking", token],
    enabled: Boolean(token),
    queryFn: async () => (await apiClient.get(`/tracking/${token}`)).data as AlertTrackingDto,
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== "resolved" ? 12_000 : false,
    retry: false,
  });
}

export function useAcknowledgeTracking(token: string | undefined) {
  return useMutation({
    mutationFn: async (): Promise<AlertTrackingDto> =>
      (await apiClient.post(`/tracking/${token}/acknowledge`)).data as AlertTrackingDto,
  });
}
