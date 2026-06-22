import { apiClient } from "@/lib/apiClient";

interface ApiItemResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface AdminSettings {
  flagKeywords: string[];
  // other settings fields omitted — we only need flagKeywords here
}

export const flagKeywordsService = {
  // GET /api/v1/admin/settings  →  pick flagKeywords out of the response
  getKeywords: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
    );
    return res.data?.flagKeywords ?? [];
  },

  // PATCH /api/v1/admin/settings  { flagKeywords: string[] }
  updateKeywords: (keywords: string[]) =>
    apiClient.patch<ApiItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { flagKeywords: keywords },
    ),
};