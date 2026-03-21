/**
 * profile.service.ts
 *
 * Thin API wrappers for user profile endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  OnboardingCompleteResponse,
  SetLocationPayload,
  SetLocationResponse,
  UpdateProfilePayload,
  UserProfile,
  UserPublicProfile,
} from '../types/profile.types';

export const profileService = {
  /** Fetch the authenticated user's full profile. */
  async getMe(): Promise<UserProfile> {
    const { data } = await http.get<UserProfile>(API.users.me);
    return data;
  },

  /** Partially update the authenticated user's profile. */
  async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await http.patch<UserProfile>(API.users.me, payload);
    return data;
  },

  /** Fetch another user's public profile by UUID. */
  async getPublicProfile(id: string): Promise<UserPublicProfile> {
    const { data } = await http.get<UserPublicProfile>(API.users.detail(id));
    return data;
  },

  /** Set or update the authenticated user's location. */
  async setLocation(payload: SetLocationPayload): Promise<SetLocationResponse> {
    const { data } = await http.post<SetLocationResponse>(
      API.users.meLocation,
      payload,
    );
    return data;
  },

  /** Mark onboarding as complete. */
  async completeOnboarding(): Promise<OnboardingCompleteResponse> {
    const { data } = await http.post<OnboardingCompleteResponse>(
      API.users.meOnboardingComplete,
      {},
    );
    return data;
  },
};
