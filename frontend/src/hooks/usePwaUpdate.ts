import { useCallback, useEffect, useState } from 'react';

import { setUpdatePromptHandler, triggerUpdate } from '../sw/pwa';

/**
 * usePwaUpdate
 *
 * Listens for PWA service-worker update events and exposes a simple
 * `{ showUpdate, applyUpdate }` API that UI components can consume.
 *
 * Call `applyUpdate()` to reload the page with the new service worker.
 */
export function usePwaUpdate() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    setUpdatePromptHandler(() => {
      setShowUpdate(true);
    });
  }, []);

  const applyUpdate = useCallback(() => {
    setShowUpdate(false);
    triggerUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    setShowUpdate(false);
  }, []);

  return { showUpdate, applyUpdate, dismissUpdate } as const;
}
