import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UserProfile } from '../types/profile.types';
import { ProfilePage } from './ProfilePage';

// ---------------------------------------------------------------------------
// Mock useProfile hook
// ---------------------------------------------------------------------------

const mockUseProfile = vi.fn();

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}));

const MOCK_PROFILE: UserProfile = {
  id: '1',
  email: 'jane@example.com',
  username: 'janedoe',
  first_name: 'Jane',
  last_name: 'Doe',
  date_of_birth: '1995-01-15',
  bio: 'Loves sci-fi and Dutch literature.',
  avatar: null,
  location: null,
  neighborhood: 'Amsterdam West',
  preferred_genres: ['Sci-Fi', 'Fantasy', 'Dutch Literature'],
  preferred_language: 'en',
  preferred_radius: 5,
  avg_rating: '4.8',
  swap_count: 42,
  rating_count: 12,
  auth_provider: 'email',
  onboarding_completed: true,
  email_verified: true,
  profile_public: true,
  member_since: '2024-03-01T00:00:00Z',
  deletion_requested_at: null,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );

describe('ProfilePage', () => {
  it('shows loading state', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state when profile fails to load', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
  });

  it('renders profile name and username', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('@janedoe')).toBeInTheDocument();
  });

  it('renders bio text', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('Loves sci-fi and Dutch literature.')).toBeInTheDocument();
  });

  it('renders neighborhood', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('Amsterdam West')).toBeInTheDocument();
  });

  it('renders swap count stat', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/swaps/i)).toBeInTheDocument();
  });

  it('renders average rating stat', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
  });

  it('renders preferred genres as tags', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Dutch Literature')).toBeInTheDocument();
  });

  it('renders avatar initial when no avatar URL', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders Edit Profile button', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
  });

  it('renders member since year', () => {
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });
});
