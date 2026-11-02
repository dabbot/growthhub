import { queryOptions } from "@tanstack/react-query";
import { getDashboardData } from "./dashboard.functions";

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardData(),
  staleTime: 5 * 60_000,
});
