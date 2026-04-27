import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showErrorToast } from '@/components/Toast';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: { uri: string; type: string; name: string } | null;
  avatar_removed?: boolean;
  preferred_genres?: string[];
  preferred_language?: string;
  preferred_radius?: number;
  profile_public?: boolean;
}

interface CheckUsernameResponse {
  available: boolean;
  suggestions?: string[];
}

// ── useUpdateProfile ─────────────────────────────────────────────────

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: async (payload) => {
      const { avatar, avatar_removed, ...jsonFields } = payload;

      const hasAvatar = avatar && avatar.uri;
      const needsFormData = hasAvatar || avatar_removed;

      if (needsFormData) {
        const form = new FormData();

        Object.entries(jsonFields).forEach(([key, value]) => {
          if (value === undefined) return;
          if (Array.isArray(value)) {
            value.forEach((v) => form.append(key, v));
          } else {
            form.append(key, String(value));
          }
        });

        if (hasAvatar) {
          form.append('avatar', {
            uri: avatar.uri,
            type: avatar.type || 'image/jpeg',
            name: avatar.name || 'avatar.jpg',
          } as unknown as Blob);
        } else if (avatar_removed) {
          form.append('avatar', '');
        }

        const { data } = await http.patch<User>(API.users.me, form, {
          headers: { 'Content-Type': undefined as unknown as string },
        });
        return data;
      }

      const { data } = await http.patch<User>(API.users.me, jsonFields);
      return data;
    },
    onSuccess: (user) => {
      setUser(user);
    },
    onError: () => showErrorToast('Failed to update profile'),
  });
}

// ── useCheckUsername ──────────────────────────────────────────────────

export function useCheckUsername(username: string, currentUsername?: string) {
  const [debouncedValue, setDebouncedValue] = useState(username);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(username), 300);
    return () => clearTimeout(timer);
  }, [username]);

  const trimmed = debouncedValue.trim().toLowerCase();
  const isOwnUsername = currentUsername?.toLowerCase() === trimmed;
  const enabled = trimmed.length >= 3 && !isOwnUsername;

  return useQuery<CheckUsernameResponse>({
    queryKey: ['checkUsername', trimmed],
    queryFn: async () => {
      const { data } = await http.get<CheckUsernameResponse>(
        API.users.checkUsername,
        { params: { q: trimmed } },
      );
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}
