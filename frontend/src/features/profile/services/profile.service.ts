/**
 * profile.service.ts
 *
 * Thin API wrappers for user profile endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  AccountDeletionCancelPayload,
  AccountDeletionPayload,
  AccountDeletionResponse,
  CheckUsernameResponse,
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
    const hasFile = Object.values(payload).some((v) => v instanceof File);

    let body: UpdateProfilePayload | FormData = payload;

    if (hasFile) {
      const form = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((item) => form.append(key, String(item)));
        } else {
          form.append(key, value as string | File);
        }
      }
      body = form;
    }

    const { data } = await http.patch<UserProfile>(API.users.me, body);
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

  /** Check if a username is available. */
  async checkUsername(query: string): Promise<CheckUsernameResponse> {
    const url = `${API.users.checkUsername}?q=${encodeURIComponent(query)}`;
    const { data } = await http.get<CheckUsernameResponse>(url);
    return data;
  },

  /** Request account deletion (GDPR). */
  async requestDeletion(payload: AccountDeletionPayload): Promise<AccountDeletionResponse> {
    const { data } = await http.post<AccountDeletionResponse>(
      API.users.meDelete,
      payload,
    );
    return data;
  },

  /** Cancel a pending account deletion. */
  async cancelDeletion(payload: AccountDeletionCancelPayload): Promise<{ detail: string }> {
    const { data } = await http.post<{ detail: string }>(
      API.users.meDeleteCancel,
      payload,
    );
    return data;
  },
};
