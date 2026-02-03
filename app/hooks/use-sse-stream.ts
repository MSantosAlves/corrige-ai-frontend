import { useCallback, useEffect, useRef } from 'react';

type EventHandler<T> = (payload: T) => void;

export const useSseStream = <T = unknown>() => {
  const streamRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    (
      eventSource: EventSource,
      handlers: { onStatus?: EventHandler<T>; onDone?: EventHandler<T> },
    ) => {
      closeStream();
      streamRef.current = eventSource;

      const parseEvent = (event: Event): T | null => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as T;
          return payload;
        } catch (streamError) {
          console.error('Failed to parse SSE payload', streamError);
          return null;
        }
      };

      eventSource.addEventListener('status', (event) => {
        const payload = parseEvent(event);
        if (payload && handlers.onStatus) {
          handlers.onStatus(payload);
        }
      });

      eventSource.addEventListener('done', (event) => {
        const payload = parseEvent(event);
        if (payload && handlers.onDone) {
          handlers.onDone(payload);
        }
        closeStream();
      });

      eventSource.addEventListener('error', () => {
        closeStream();
      });
    },
    [closeStream],
  );

  useEffect(() => () => closeStream(), [closeStream]);

  return { startStream, closeStream };
};
