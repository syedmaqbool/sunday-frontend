import type { AnalyticsDateRange, DateFilter } from '@/types/analyticsDateRange.type';

export function getAnalyticsDateRange(
  dateFilter: DateFilter,
  referenceDate = new Date(),
): AnalyticsDateRange {
  if (dateFilter === 'all')
    return {};

  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(referenceDate);
  if (dateFilter === 'today') {
    startDate.setHours(0, 0, 0, 0);
  }
  else if (dateFilter === '7d') {
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  }
  else {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    endTime: endDate.toISOString(),
    startTime: startDate.toISOString(),
  };
}
