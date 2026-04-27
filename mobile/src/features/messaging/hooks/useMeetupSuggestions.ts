import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { MeetupLocation } from '@/types';

export function useMeetupSuggestions(exchangeId: string) {
  return useQuery({
    queryKey: ['meetup-suggestions', exchangeId],
    queryFn: async () => {
      const { data } = await http.get<MeetupLocation[]>(
        API.messaging.meetupSuggestions(exchangeId),
      );
      return data;
    },
    enabled: !!exchangeId,
  });
}
