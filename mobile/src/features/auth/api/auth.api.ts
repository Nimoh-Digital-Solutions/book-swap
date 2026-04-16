import axios from 'axios';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { env } from '@/configs/env';
import type { LoginResponse, User } from '@/types';

const plain = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'mobile' },
});

export const authApi = {
  async login(credentials: { email_or_username: string; password: string }) {
    const { data } = await plain.post<LoginResponse>(API.auth.login, credentials);
    return data;
  },

  async register(payload: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
  }) {
    const { data } = await plain.post(API.auth.register, {
      ...payload,
      privacy_policy_accepted: true,
      terms_of_service_accepted: true,
    });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await http.get<User>(API.users.me);
    return data;
  },

  async refreshToken(refreshToken: string) {
    const { data } = await plain.post<{ access: string; refresh?: string }>(
      API.auth.refresh,
      { refresh: refreshToken },
    );
    return {
      access_token: data.access,
      refresh_token: data.refresh ?? refreshToken,
    };
  },

  async forgotPassword(email: string) {
    const { data } = await plain.post(API.auth.passwordReset, { email });
    return data;
  },

  async logout(refreshToken: string) {
    try {
      await http.post(API.auth.logout, { refresh: refreshToken });
    } catch {
      // Best-effort; server may already have invalidated
    }
  },
};
