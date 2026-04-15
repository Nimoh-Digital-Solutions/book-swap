import { useEffect, useState } from 'react';
import { isServerDegraded, subscribeCircuit } from '@/services/http';

export function useIsServerDegraded() {
  const [degraded, setDegraded] = useState(() => isServerDegraded());

  useEffect(
    () =>
      subscribeCircuit(() => {
        setDegraded(isServerDegraded());
      }),
    [],
  );

  return degraded;
}
