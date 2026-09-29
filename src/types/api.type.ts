import type { GetAdminBrandsResponses, GetHealthErrors, GetHealthResponses } from '@/types/generated-api';

export type ApiSuccessResponse<Responses> = {
  [Status in keyof Responses]: Status extends number | string
    ? `${Status}` extends `2${string}` ? Responses[Status] : never
    : never;
}[keyof Responses];

export type ApiResponseData<Responses> = ApiSuccessResponse<Responses> extends infer Response
  ? Response extends { data: infer Data }
    ? Data
    : never
  : never;

export type ApiResponseItem<Responses> = ApiResponseData<Responses> extends Array<infer Item>
  ? Item
  : never;

export type ApiRequestBody<Operation> = Operation extends { body?: infer Body }
  ? NonNullable<Body>
  : never;

export type ApiRequestQuery<Operation> = Operation extends { query?: infer Query }
  ? NonNullable<Query>
  : never;

type BaseApiResponse = Omit<ApiSuccessResponse<GetHealthResponses>, 'statusCode'> & { statusCode: number };
type BasePaginatedApiResponse = Extract<ApiSuccessResponse<GetAdminBrandsResponses>, { pagination: unknown }>;

export type Response<Data = undefined> = Data extends undefined
  ? Omit<BaseApiResponse, 'data'>
  : Omit<BaseApiResponse, 'data'> & { data: Data };
export type Pagination = BasePaginatedApiResponse['pagination'];
export type PaginatedResponse<Data = unknown> = Omit<BasePaginatedApiResponse, 'data'> & { data: Data[] };

export type FieldError = NonNullable<GetHealthErrors[500]['fieldErrors']>[number];
export type ErrorResponse = Partial<GetHealthErrors[500]> & { error?: string };
