import type { ApiResponse } from '@nimoh-digital-solutions/tast-utils';
import { http } from '@services';
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';

/** HTTP methods supported by useApiMutation. */
type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * useApiMutation — typed wrapper around TanStack Query's `useMutation` that
 * sends requests via the app's HTTP client.
 *
 * Handles auth headers, CSRF tokens, and error parsing through the interceptor
 * chain configured on the HTTP client.
 *
 * @param endpoint - API endpoint (relative to baseUrl, e.g. '/users')
 * @param method   - HTTP method (defaults to 'POST')
 * @param options  - Standard UseMutationOptions overrides (minus mutationFn)
 *
 * @example
 * const createUser = useApiMutation<User, { name: string }>('/users');
 * createUser.mutate({ name: 'Alice' });
 *
 * @example
 * // With cache invalidation
 * const updateStory = useApiMutation<Story, Partial<Story>>(
 *   `/stories/${id}`,
 *   'PATCH',
 *   {
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: ['stories'] });
 *     },
 *   },
 * );
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TError = Error>(
  endpoint: string,
  method: MutationMethod = 'POST',
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>,
): UseMutationResult<TData, TError, TVariables> {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      let response: ApiResponse<TData>;

      switch (method) {
        case 'POST':
          response = await http.post<TData>(endpoint, variables);
          break;
        case 'PUT':
          response = await http.put<TData>(endpoint, variables);
          break;
        case 'PATCH':
          response = await http.patch<TData>(endpoint, variables);
          break;
        case 'DELETE':
          response = await http.delete<TData>(endpoint);
          break;
      }

      return response.data;
    },
    ...options,
  });
}
