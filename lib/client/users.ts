"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@/lib/types";
import { apiClient } from "./api";

export function useProfile() {
  return useQuery<UserDto>({
    queryKey: ["profile"],
    queryFn: async () => (await apiClient.get("/users/me")).data as UserDto,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name?: string; phone?: string | null }) => {
      const response = await apiClient.patch("/users/me", dto);
      return response.data as UserDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
