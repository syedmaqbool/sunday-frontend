import type { ApiRequestQuery } from './api.type';
import type { GetAdminAnalyticsData } from '@/types/generated-api';

export type DateFilter = '7d' | 'all' | 'month' | 'today';

export type AnalyticsDateRange = Pick<ApiRequestQuery<GetAdminAnalyticsData>, 'endTime' | 'startTime'>;
