import type { DateFilter } from '@/types/analyticsDateRange.type';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AnalyticsPeriodFilter({
  onChange,
  value,
}: {
  onChange: (dateFilter: DateFilter) => void;
  value: DateFilter;
}) {
  return (
    <Tabs
      onValueChange={dateFilter => onChange(dateFilter as DateFilter)}
      value={value}
      aria-label="Analytics time period"
    >
      <TabsList className="w-full justify-between">
        <TabsTrigger
          value="all"
          className="
            px-2 text-xs
            sm:px-3 sm:text-sm
          "
        >
          All time
        </TabsTrigger>
        <TabsTrigger
          value="today"
          className="
            px-2 text-xs
            sm:px-3 sm:text-sm
          "
        >
          Today
        </TabsTrigger>
        <TabsTrigger
          value="7d"
          className="
            px-2 text-xs
            sm:px-3 sm:text-sm
          "
        >
          Last 7 days
        </TabsTrigger>
        <TabsTrigger
          value="month"
          className="
            px-2 text-xs
            sm:px-3 sm:text-sm
          "
        >
          This month
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
