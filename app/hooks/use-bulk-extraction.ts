import { useMemo, useState } from 'react';

import { useSseStream } from './use-sse-stream';
import { startBulkExtractionStream } from '../services/extractions-service';
import type { ExtractionUserPayload } from '../services/extractions-service';

type BulkProgressPayload = {
  user?: ExtractionUserPayload;
  progress?: {
    completed?: number;
    total?: number;
    extracted?: number;
    graded?: number;
  };
};

export const useBulkExtraction = (params?: {
  onUserStateUpdate?: (payload: ExtractionUserPayload) => void;
}) => {
  const { onUserStateUpdate } = params ?? {};
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCompleted, setBulkCompleted] = useState(0);
  const [bulkExtracted, setBulkExtracted] = useState(0);
  const [bulkGraded, setBulkGraded] = useState(0);
  const { startStream, closeStream } = useSseStream<BulkProgressPayload>();

  const isBulkInProgress = bulkTotal > 0 && bulkCompleted < bulkTotal;
  const bulkProgressPercent = useMemo(() => {
    if (bulkTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bulkCompleted / bulkTotal) * 100));
  }, [bulkCompleted, bulkTotal]);

  const bulkExtractedPercent = useMemo(() => {
    if (bulkTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bulkExtracted / bulkTotal) * 100));
  }, [bulkExtracted, bulkTotal]);

  const bulkGradedPercent = useMemo(() => {
    if (bulkTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bulkGraded / bulkTotal) * 100));
  }, [bulkGraded, bulkTotal]);

  const resetBulkProgress = () => {
    setBulkTotal(0);
    setBulkCompleted(0);
    setBulkExtracted(0);
    setBulkGraded(0);
    closeStream();
  };

  const updateProgressFromPayload = (payload: BulkProgressPayload) => {
    if (payload.user) {
      onUserStateUpdate?.(payload.user);
    }
    const total = payload.progress?.total ?? 0;
    const completed = payload.progress?.completed ?? 0;
    const extracted = payload.progress?.extracted ?? 0;
    const graded = payload.progress?.graded ?? 0;
    if (!total) {
      return;
    }
    setBulkTotal((current) => Math.max(current, total));
    setBulkCompleted((current) => Math.max(current, completed));
    setBulkExtracted((current) => Math.max(current, extracted));
    setBulkGraded((current) => Math.max(current, graded));
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
    bulkExtracted,
    bulkGraded,
    bulkExtractedPercent,
    bulkGradedPercent,
    isBulkInProgress,
    resetBulkProgress,
    startBulkStream,
  };
};
