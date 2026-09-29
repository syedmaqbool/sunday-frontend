import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateAdminHelpTutorialData,
  GetAdminHelpTutorialsData,
  GetAdminHelpTutorialsResponses,
  UpdateAdminHelpTutorialData,
} from '@/types/generated-api';

export type HelpTutorial = ApiResponseItem<GetAdminHelpTutorialsResponses>;
export type AdminHelpTutorialParameters = Partial<ApiRequestQuery<GetAdminHelpTutorialsData>>;
export type CreateHelpTutorialPayload = ApiRequestBody<CreateAdminHelpTutorialData>;
export type UpdateHelpTutorialPayload = ApiRequestBody<UpdateAdminHelpTutorialData>;
