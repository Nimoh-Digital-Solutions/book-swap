import * as Notifications from 'expo-notifications';

const mockNavigate = jest.fn();
const mockIsReady = jest.fn(() => true);

jest.mock('@/navigation/navigationRef', () => ({
  navigationRef: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    isReady: () => mockIsReady(),
  },
}));

jest.mock('@/components/Toast', () => ({
  showInfoToast: jest.fn(),
}));

// Reset module state between tests so `initNotificationHandlers` re-registers.
function loadHandlerFresh() {
  jest.isolateModules(() => {
    require('@/services/notificationHandler').initNotificationHandlers();
  });
}

function getResponseListener(): (response: { notification: { request: { content: { data: Record<string, unknown> } } } }) => void {
  const calls = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
}

function fakeResponse(data: Record<string, unknown>) {
  return {
    notification: {
      request: {
        content: {
          data,
          title: undefined,
          body: undefined,
        },
      },
    },
  } as never;
}

describe('notificationHandler — navigateFromPayload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReady.mockReturnValue(true);
  });

  it('does not navigate when navigationRef is not ready', () => {
    mockIsReady.mockReturnValue(false);
    loadHandlerFresh();

    const listener = getResponseListener();
    listener(fakeResponse({ type: 'new_message', exchange_id: 'ex_1' }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('routes new_message → MessagesTab/Chat with the exchangeId', () => {
    loadHandlerFresh();
    getResponseListener()(fakeResponse({ type: 'new_message', exchange_id: 'ex_42' }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'MessagesTab',
      params: { screen: 'Chat', params: { exchangeId: 'ex_42' } },
    });
  });

  it('routes chat_message and message aliases to Chat as well', () => {
    loadHandlerFresh();
    const listener = getResponseListener();

    listener(fakeResponse({ type: 'chat_message', exchangeId: 'ex_a' }));
    listener(fakeResponse({ type: 'message', exchange_id: 'ex_b' }));

    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate.mock.calls[0][1].params.params.exchangeId).toBe('ex_a');
    expect(mockNavigate.mock.calls[1][1].params.params.exchangeId).toBe('ex_b');
    expect(mockNavigate.mock.calls[0][1].params.screen).toBe('Chat');
  });

  it.each([
    'new_request',
    'request_accepted',
    'request_declined',
    'counter_proposed',
    'counter_approved',
    'exchange_completed',
    'exchange_updated',
    'exchange',
    'swap_request',
  ])('routes %s → MessagesTab/ExchangeDetail', (type) => {
    loadHandlerFresh();
    getResponseListener()(fakeResponse({ type, exchange_id: 'ex_99' }));

    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'MessagesTab',
      params: { screen: 'ExchangeDetail', params: { exchangeId: 'ex_99' } },
    });
  });

  it.each(['book_available', 'book', 'wishlist_match'])(
    'routes %s → HomeTab/BookDetail when bookId is present',
    (type) => {
      loadHandlerFresh();
      getResponseListener()(fakeResponse({ type, book_id: 'bk_1' }));

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'HomeTab',
        params: { screen: 'BookDetail', params: { bookId: 'bk_1' } },
      });
    },
  );

  it('does nothing for an unknown notification type', () => {
    loadHandlerFresh();
    getResponseListener()(fakeResponse({ type: 'mystery', exchange_id: 'ex_1', book_id: 'bk_1' }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing for exchange types when exchangeId is missing', () => {
    loadHandlerFresh();
    getResponseListener()(fakeResponse({ type: 'new_request' }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing for book types when bookId is missing', () => {
    loadHandlerFresh();
    getResponseListener()(fakeResponse({ type: 'book_available' }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('also handles the cold-start (getLastNotificationResponseAsync) path', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(
      fakeResponse({ type: 'new_message', exchange_id: 'ex_cold' }),
    );

    loadHandlerFresh();
    // Allow the queued promise to resolve.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'MessagesTab',
      params: { screen: 'Chat', params: { exchangeId: 'ex_cold' } },
    });
  });
});
