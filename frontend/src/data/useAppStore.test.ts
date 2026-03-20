import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from './useAppStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useAppStore.setState({ notifications: [] });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAppStore — notifications', () => {
  beforeEach(resetStore);

  describe('addNotification', () => {
    it('adds a notification and returns a unique id', () => {
      const id = useAppStore.getState().addNotification('Hello');

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);

      const { notifications } = useAppStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        id,
        message: 'Hello',
        variant: 'info',
        duration: 5000,
      });
    });

    it('defaults variant to "info" when not provided', () => {
      useAppStore.getState().addNotification('Default variant');
      expect(useAppStore.getState().notifications[0]?.variant).toBe('info');
    });

    it('accepts a custom variant', () => {
      useAppStore.getState().addNotification('Success!', { variant: 'success' });
      expect(useAppStore.getState().notifications[0]?.variant).toBe('success');
    });

    it('accepts a custom duration', () => {
      useAppStore.getState().addNotification('Long', { duration: 10000 });
      expect(useAppStore.getState().notifications[0]?.duration).toBe(10000);
    });

    it('duration=0 means never auto-dismiss', () => {
      useAppStore.getState().addNotification('Sticky', { duration: 0 });
      expect(useAppStore.getState().notifications[0]?.duration).toBe(0);
    });

    it('accumulates multiple notifications', () => {
      useAppStore.getState().addNotification('First');
      useAppStore.getState().addNotification('Second');
      useAppStore.getState().addNotification('Third');
      expect(useAppStore.getState().notifications).toHaveLength(3);
    });

    it('generates unique ids for each notification', () => {
      const id1 = useAppStore.getState().addNotification('A');
      const id2 = useAppStore.getState().addNotification('B');
      expect(id1).not.toBe(id2);
    });
  });

  describe('dismissNotification', () => {
    it('removes the notification with the matching id', () => {
      const id = useAppStore.getState().addNotification('To be dismissed');
      useAppStore.getState().dismissNotification(id);
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });

    it('does not remove other notifications', () => {
      const id1 = useAppStore.getState().addNotification('Keep me');
      const id2 = useAppStore.getState().addNotification('Dismiss me');
      useAppStore.getState().dismissNotification(id2);

      const { notifications } = useAppStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.id).toBe(id1);
    });

    it('is a no-op when id does not exist', () => {
      useAppStore.getState().addNotification('Existing');
      useAppStore.getState().dismissNotification('non-existent-id');
      expect(useAppStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('clearNotifications', () => {
    it('removes all notifications at once', () => {
      useAppStore.getState().addNotification('One');
      useAppStore.getState().addNotification('Two');
      useAppStore.getState().addNotification('Three');
      useAppStore.getState().clearNotifications();
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });

    it('is safe to call when there are no notifications', () => {
      expect(() => useAppStore.getState().clearNotifications()).not.toThrow();
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });
  });
});
