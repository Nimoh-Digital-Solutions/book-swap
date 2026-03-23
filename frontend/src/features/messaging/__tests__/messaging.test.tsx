/**
 * messaging.test.tsx — Epic 6 Phase 5
 *
 * Integration / component tests for the messaging feature:
 * MessageBubble, MessageInput, TypingIndicator, ChatHeader,
 * MeetupSuggestionPanel.
 */
import {
  MOCK_CHAT_MESSAGE,
  MOCK_CHAT_MESSAGE_PARTNER,
  MOCK_MEETUP_LOCATION,
} from '@test/mocks/handlers';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatHeader } from '../components/ChatHeader/ChatHeader';
import { MeetupSuggestionPanel } from '../components/MeetupSuggestionPanel/MeetupSuggestionPanel';
import { MessageBubble } from '../components/MessageBubble/MessageBubble';
import { MessageInput } from '../components/MessageInput/MessageInput';
import { TypingIndicator } from '../components/TypingIndicator/TypingIndicator';
import type { ChatMessage, MeetupLocation } from '../types/messaging.types';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MessageBubble
// ══════════════════════════════════════════════════════════════════════════════

describe('MessageBubble', () => {
  const ownMessage: ChatMessage = MOCK_CHAT_MESSAGE as ChatMessage;
  const partnerMessage: ChatMessage = MOCK_CHAT_MESSAGE_PARTNER as ChatMessage;

  it('renders own message with accent styling', () => {
    renderWithProviders(<MessageBubble message={ownMessage} isOwn={true} />);
    expect(screen.getByText(ownMessage.content)).toBeInTheDocument();
    // Own message should be right-aligned (justify-end)
    const wrapper = screen.getByText(ownMessage.content).closest('[class*="justify"]');
    expect(wrapper?.className).toContain('justify-end');
  });

  it('renders partner message with avatar', () => {
    renderWithProviders(<MessageBubble message={partnerMessage} isOwn={false} />);
    expect(screen.getByText(partnerMessage.content)).toBeInTheDocument();
    // Should show avatar initial
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('shows read receipt for own read message', () => {
    const readMessage = { ...ownMessage, read_at: '2025-07-16T10:05:00Z' };
    renderWithProviders(<MessageBubble message={readMessage} isOwn={true} />);
    expect(screen.getByLabelText(/read/i)).toBeInTheDocument();
  });

  it('shows sent indicator for own unread message', () => {
    renderWithProviders(<MessageBubble message={ownMessage} isOwn={true} />);
    expect(screen.getByLabelText(/sent/i)).toBeInTheDocument();
  });

  it('renders image attachment', () => {
    const imageMessage = { ...ownMessage, image: 'https://example.com/photo.jpg' };
    renderWithProviders(<MessageBubble message={imageMessage} isOwn={true} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    renderWithProviders(<MessageBubble message={ownMessage} isOwn={true} />);
    // Should show time (format "10:00" or similar)
    const timeText = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeText).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TypingIndicator
// ══════════════════════════════════════════════════════════════════════════════

describe('TypingIndicator', () => {
  it('renders typing text with partner name', () => {
    renderWithProviders(<TypingIndicator username="bookworm" />);
    expect(screen.getByText(/bookworm is typing/i)).toBeInTheDocument();
  });

  it('shows animated dots', () => {
    const { container } = renderWithProviders(<TypingIndicator username="bookworm" />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MessageInput
// ══════════════════════════════════════════════════════════════════════════════

describe('MessageInput', () => {
  it('renders input and send button', () => {
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('enables send button when text is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );

    await user.type(screen.getByPlaceholderText(/type a message/i), 'Hello');
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  it('calls onSend with text when submitted', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(
      <MessageInput onSend={onSend} onTyping={vi.fn()} />,
    );

    await user.type(screen.getByPlaceholderText(/type a message/i), 'Hello!');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith('Hello!', undefined);
  });

  it('calls onTyping when text is entered', async () => {
    const user = userEvent.setup();
    const onTyping = vi.fn();
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={onTyping} />,
    );

    await user.type(screen.getByPlaceholderText(/type a message/i), 'Hi');
    expect(onTyping).toHaveBeenCalled();
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, 'Hello!');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(input).toHaveValue('');
  });

  it('shows character counter', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );

    await user.type(screen.getByPlaceholderText(/type a message/i), 'Hello');
    expect(screen.getByText('5 / 1000')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} disabled={true} />,
    );
    expect(screen.getByPlaceholderText(/type a message/i)).toBeDisabled();
  });

  it('shows attach image button', () => {
    renderWithProviders(
      <MessageInput onSend={vi.fn()} onTyping={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /attach image/i })).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ChatHeader
// ══════════════════════════════════════════════════════════════════════════════

describe('ChatHeader', () => {
  it('renders partner name', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={false}
        onSuggestMeetup={vi.fn()}
      />,
    );
    expect(screen.getByText('bookworm')).toBeInTheDocument();
  });

  it('shows connected status when connected', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={true}
        onSuggestMeetup={vi.fn()}
      />,
    );
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('shows connecting status when disconnected', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={false}
        onSuggestMeetup={vi.fn()}
      />,
    );
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('shows suggest meetup button', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={true}
        onSuggestMeetup={vi.fn()}
      />,
    );
    expect(screen.getByText(/suggest meetup/i)).toBeInTheDocument();
  });

  it('calls onSuggestMeetup when button is clicked', async () => {
    const user = userEvent.setup();
    const onSuggestMeetup = vi.fn();
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={true}
        onSuggestMeetup={onSuggestMeetup}
      />,
    );

    await user.click(screen.getByText(/suggest meetup/i));
    expect(onSuggestMeetup).toHaveBeenCalledOnce();
  });

  it('hides meetup button when showMeetupButton is false', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={true}
        onSuggestMeetup={vi.fn()}
        showMeetupButton={false}
      />,
    );
    expect(screen.queryByText(/suggest meetup/i)).not.toBeInTheDocument();
  });

  it('shows partner avatar initial when no avatar', () => {
    renderWithProviders(
      <ChatHeader
        partnerName="bookworm"
        partnerAvatar={null}
        isConnected={true}
        onSuggestMeetup={vi.fn()}
      />,
    );
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MeetupSuggestionPanel
// ══════════════════════════════════════════════════════════════════════════════

describe('MeetupSuggestionPanel', () => {
  const locations: MeetupLocation[] = [
    MOCK_MEETUP_LOCATION as MeetupLocation,
    {
      id: 'loc_002',
      name: 'Vondelpark',
      address: 'Vondelpark',
      category: 'park',
      city: 'Amsterdam',
      latitude: 52.3580,
      longitude: 4.8686,
      distance_km: 2.5,
    },
  ];

  it('renders location list', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('OBA Oosterdok')).toBeInTheDocument();
    expect(screen.getAllByText('Vondelpark').length).toBeGreaterThan(0);
  });

  it('shows distance for each location', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('1.2 km away')).toBeInTheDocument();
    expect(screen.getByText('2.5 km away')).toBeInTheDocument();
  });

  it('shows category labels', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Park')).toBeInTheDocument();
  });

  it('calls onSelect when select button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const selectBtns = screen.getAllByText('Select');
    await user.click(selectBtns[0]!);
    expect(onSelect).toHaveBeenCalledWith(locations[0]);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows empty state when no locations', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={[]}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/no meetup suggestions/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={[]}
        isLoading={true}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Loading should show animated text
    const loadingEl = screen.getByText(/connecting/i);
    expect(loadingEl.className).toContain('animate-pulse');
  });

  it('shows select buttons for each location', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const selectBtns = screen.getAllByText('Select');
    expect(selectBtns).toHaveLength(2);
  });

  it('renders panel title', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Meetup Suggestions')).toBeInTheDocument();
  });

  it('shows address for each location', () => {
    renderWithProviders(
      <MeetupSuggestionPanel
        locations={locations}
        isLoading={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Oosterdokskade 143')).toBeInTheDocument();
  });
});
