import { Route, Routes } from 'react-router-dom';

import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditProfilePage } from '../pages/EditProfilePage';
import type { UserProfile } from '../types/profile.types';

// EditProfileForm pulls in mutations and the avatar uploader; replacing it
// with a stub keeps these tests focused on the orchestrator (AUD-W-602).
vi.mock('../components/EditProfileForm', () => ({
  EditProfileForm: ({ profile }: { profile: UserProfile }) => (
    <div data-testid="edit-profile-form">form for {profile.username}</div>
  ),
}));

const mockUseProfile = vi.fn();

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}));

const MOCK_PROFILE: UserProfile = {
  id: 'usr_1',
  email: 'reader@example.com',
  username: 'bookworm',
  first_name: 'Book',
  last_name: 'Worm',
  date_of_birth: null,
  bio: 'Reads everything.',
  avatar: null,
  location: { latitude: 52.37, longitude: 4.89 },
  neighborhood: 'Jordaan',
  preferred_genres: ['Fiction'],
  preferred_language: 'en',
  preferred_radius: 5_000,
  avg_rating: '4.5',
  swap_count: 7,
  rating_count: 4,
  auth_provider: 'email',
  onboarding_completed: true,
  email_verified: true,
  member_since: '2025-06-01T10:00:00Z',
  profile_public: true,
  deletion_requested_at: null,
};

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/:lng/profile/edit" element={<EditProfilePage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/en/profile/edit'] } },
  );
}

beforeEach(() => {
  mockUseProfile.mockReset();
});

describe('EditProfilePage', () => {
  it('shows the loading state while the profile is fetching', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows the error state when the profile fails to load', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderPage();
    expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
  });

  it('renders the heading and form when the profile resolves', () => {
    mockUseProfile.mockReturnValue({
      data: MOCK_PROFILE,
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: /edit profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('edit-profile-form')).toHaveTextContent(
      'form for bookworm',
    );
  });

  it('renders the back-to-profile button', () => {
    mockUseProfile.mockReturnValue({
      data: MOCK_PROFILE,
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(
      screen.getByRole('button', { name: /back to profile/i }),
    ).toBeInTheDocument();
  });
});
