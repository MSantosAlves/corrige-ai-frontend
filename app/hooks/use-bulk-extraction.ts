import { useMemo, useState } from 'react';

import { useSseStream } from './use-sse-stream';
import { startBulkExtractionStream } from '../services/extractions-service';

export const useBulkExtraction = () => {
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCompleted, setBulkCompleted] = useState(0);
  const { startStream, closeStream } = useSseStream<{
    progress?: { completed?: number; total?: number };
  }>();

  const isBulkInProgress = bulkTotal > 0 && bulkCompleted < bulkTotal;
  const bulkProgressPercent = useMemo(() => {
    if (bulkTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bulkCompleted / bulkTotal) * 100));
  }, [bulkCompleted, bulkTotal]);

  const resetBulkProgress = () => {
    setBulkTotal(0);
    setBulkCompleted(0);
    closeStream();
  };

  const updateProgressFromPayload = (payload: {
    progress?: { completed?: number; total?: number };
  }) => {
    const total = payload.progress?.total ?? 0;
    const completed = payload.progress?.completed ?? 0;
    if (!total) {
      return;
    }
    setBulkTotal((current) => Math.max(current, total));
    setBulkCompleted((current) => Math.max(current, completed));
  };

  const startBulkStream = (batchId: string) => {
    const eventSource = startBulkExtractionStream(batchId);
    startStream(eventSource, {
      onStatus: updateProgressFromPayload,
      onDone: updateProgressFromPayload,
    });
  };

  return {
    bulkTotal,
    setBulkTotal,
    bulkCompleted,
    setBulkCompleted,
    bulkProgressPercent,
    isBulkInProgress,
    resetBulkProgress,
    startBulkStream,
  };
};
