import { computeIsOffline, netinfoIndicatesOnline } from '@/hooks/networkStatus';

describe('networkStatus (useNetworkStatus helpers)', () => {
  describe('netinfoIndicatesOnline', () => {
    it('is true when connected and reachable', () => {
      expect(
        netinfoIndicatesOnline({ isConnected: true, isInternetReachable: true }),
      ).toBe(true);
    });

    it('is true when connected and reachability unknown (null)', () => {
      expect(
        netinfoIndicatesOnline({ isConnected: true, isInternetReachable: null }),
      ).toBe(true);
    });

    it('is false when connected but explicitly unreachable', () => {
      expect(
        netinfoIndicatesOnline({ isConnected: true, isInternetReachable: false }),
      ).toBe(false);
    });

    it('is false when not connected', () => {
      expect(
        netinfoIndicatesOnline({ isConnected: false, isInternetReachable: true }),
      ).toBe(false);
    });
  });

  describe('computeIsOffline', () => {
    it('is true when disconnected', () => {
      expect(computeIsOffline(false, true)).toBe(true);
    });

    it('is true when internet unreachable', () => {
      expect(computeIsOffline(true, false)).toBe(true);
    });

    it('is false when both null', () => {
      expect(computeIsOffline(null, null)).toBe(false);
    });

    it('is false when connected with unknown reachability', () => {
      expect(computeIsOffline(true, null)).toBe(false);
    });
  });
});
