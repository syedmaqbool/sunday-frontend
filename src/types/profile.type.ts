import type { ApiRequestBody, ApiResponseData } from './api.type';
import type { GetMyProfileResponses, UpdateMyBankDetailsData, UpdateMyProfileData, UploadFileResponses } from '@/types/generated-api';

export type Profile = ApiResponseData<GetMyProfileResponses>;
export type ProfileImage = NonNullable<Profile['image']>;
export type UpdateProfilePayload = ApiRequestBody<UpdateMyProfileData>;
export type UpdateBankDetailsPayload = ApiRequestBody<UpdateMyBankDetailsData>;
export type UploadedFile = ApiResponseData<UploadFileResponses>;
