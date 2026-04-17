import axios from 'axios';
import { env } from '@/configs/env';
import { API } from '@/configs/apiEndpoints';
import type { SocialAuthResponse, AppleSignInUser } from '@/types';

const plain = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'mobile' },
});

export const socialAuthApi = {
  async googleSignIn(idToken: string): Promise<SocialAuthResponse> {
    const { data } = await plain.post<SocialAuthResponse>(
      API.auth.socialGoogleMobile,
      { id_token: idToken },
    );
    return data;
  },

  async appleSignIn(
    identityToken: string,
    user?: AppleSignInUser,
  ): Promise<SocialAuthResponse> {
    const { data } = await plain.post<SocialAuthResponse>(
      API.auth.socialAppleMobile,
      { identity_token: identityToken, user },
    );
    return data;
  },
};
