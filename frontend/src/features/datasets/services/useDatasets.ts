import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { datasetsService } from "./datasetsService";

export const useDatasets = () => {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: datasetsService.fetchAll,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

export const useUploadDataset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => datasetsService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
};
