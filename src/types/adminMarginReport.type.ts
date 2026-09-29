import type { ApiRequestQuery, ApiSuccessResponse } from './api.type';
import type {
  GetAdminMarginReportData,
  GetAdminMarginReportResponses,
} from '@/types/generated-api';

export type AdminMarginDatePreset = '7d' | '30d' | '90d' | 'all' | 'today';
export type AdminMarginFilter = NonNullable<
  ApiRequestQuery<GetAdminMarginReportData>['marginFilter']
>;
export type AdminMarginDateRange = Pick<
  ApiRequestQuery<GetAdminMarginReportData>,
  'from' | 'to'
>;
export type AdminMarginReportParams = Partial<
  ApiRequestQuery<GetAdminMarginReportData>
>;
export type AdminMarginReportResponse = ApiSuccessResponse<
  GetAdminMarginReportResponses
>;
export type AdminMarginReportOrder = AdminMarginReportResponse['data'][number];
export type AdminMarginReportAggregates = AdminMarginReportResponse['aggregates'];
