import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sqlService } from "./sqlService";

export const useQueryHistory = () => {
  return useQuery({
    queryKey: ["queryHistory"],
    queryFn: sqlService.getHistory,
    staleTime: 30000, 
  });
};

export const useRunQuery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sql: string) => sqlService.runQuery(sql),
    onSuccess: (data) => {
      // Optimistically update history or invalidate
      // For now, let's invalidate to fetch fresh history including the new query
      queryClient.invalidateQueries({ queryKey: ["queryHistory"] });
    },
  });
};
