import { useMutation } from "@tanstack/react-query";
import { http } from "@/services/http";
import { API } from "@/configs/apiEndpoints";
import type { CreateReportPayload } from "@/types";

export function useReportUser() {
  return useMutation<void, Error, CreateReportPayload>({
    mutationFn: async (payload) => {
      await http.post(API.reports.create, payload);
    },
  });
}
