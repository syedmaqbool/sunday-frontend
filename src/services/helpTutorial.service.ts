import type {
  CreateHelpTutorialPayload,
  HelpTutorial,
  UpdateHelpTutorialPayload,
} from '@/types/helpTutorial.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getHelpTutorials() {
  return authInstance
    .get('api/v1/help-tutorials')
    .json<Response<HelpTutorial[]>>();
}

export function listAdminHelpTutorials(params: { page?: number; size?: number }) {
  return authInstance
    .get('api/v1/admin/settings/help-tutorials', {
      searchParams: {
        ...(params.page != null && { page: params.page }),
        ...(params.size != null && { size: params.size }),
      },
    })
    .json<PaginatedResponse<HelpTutorial>>();
}

export function createAdminHelpTutorial(payload: CreateHelpTutorialPayload) {
  return authInstance
    .post('api/v1/admin/settings/help-tutorials', { json: payload })
    .json<Response<HelpTutorial>>();
}

export function updateAdminHelpTutorial(
  resourceId: string,
  payload: UpdateHelpTutorialPayload,
) {
  return authInstance
    .patch(`api/v1/admin/settings/help-tutorials/${resourceId}`, { json: payload })
    .json<Response<HelpTutorial>>();
}

export function deleteAdminHelpTutorial(resourceId: string) {
  return authInstance
    .delete(`api/v1/admin/settings/help-tutorials/${resourceId}`)
    .json<Response>();
}
