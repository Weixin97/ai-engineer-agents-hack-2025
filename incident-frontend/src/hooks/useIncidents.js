import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useIncidents = () => {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        console.log('useIncidents: Calling apiService.getIncidents()');
        const result = await apiService.getIncidents();
        console.log('useIncidents: Success:', result);
        return result;
      } catch (error) {
        console.error('useIncidents: Error:', error);
        throw error;
      }
    },
    refetchInterval: 3000,
    retry: 1,
    // Add these options to help with debugging
    staleTime: 0,
    cacheTime: 0,
  });
};

export const useIncident = (incidentId) => {
  return useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => apiService.getIncident(incidentId),
    enabled: !!incidentId,
    refetchInterval: 2000,
  });
};

// export const useCreateIncident = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: apiService.createIncident(alert),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['incidents'] });
//     },
//   });
// };

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ incidentId, review }) => apiService.submitReview(incidentId, review),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident', variables.incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};
