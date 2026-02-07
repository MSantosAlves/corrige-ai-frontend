import { useRef, useState } from 'react';

import { extractTextBulk, type BulkExtractionResponse } from '../services/extractions-service';
import { normalizeJpepgFile } from '../helpers/file-helpers';
import { persistPlanUsage, type PlanUsage } from '../helpers/plan-usage';

type DocumentTypeKey = 'pdf_native' | 'printed' | 'handwritten' | 'auto';

type AuthUser = { id: string; name: string } | null;

export const useExtractionFlow = (params: {
  documentType: DocumentTypeKey;
  authUser: AuthUser;
  selectedClassId: string | null;
  selectedTaskId: string | null;
  setIsLoginMenuOpen: (value: boolean) => void;
  setIsClassTaskModalOpen: (value: boolean) => void;
  startBulkStream: (batchId: string) => void;
  setBulkTotal: (value: number) => void;
  setBulkCompleted: (value: number) => void;
  setCachedFileName: (value: string | null) => void;
  setSelectedFiles: (value: File[]) => void;
  resetBulkProgress: () => void;
  setUploadCompleted: (value: boolean) => void;
  setUploadStarted: (value: boolean) => void;
  onExtractionComplete?: (payload: { classId: string; taskId: string; mode: 'bulk' }) => void;
  onPlanUsageUpdate?: (payload: PlanUsage) => void;
}) => {
  const {
    documentType,
    authUser,
    selectedClassId,
    selectedTaskId,
    setIsLoginMenuOpen,
    setIsClassTaskModalOpen,
    startBulkStream,
    setBulkTotal,
    setBulkCompleted,
    setCachedFileName,
    setUploadCompleted,
    setUploadStarted,
    onExtractionComplete,
    onPlanUsageUpdate,
  } = params;

  const [isUploading, setIsUploading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [error, setError] = useState('');
  const manualStartRef = useRef(false);

  const clearResults = () => {
    setResultText('');
    setAnalysisText('');
  };

  const uploadFiles = async (
    files: File[],
    overrides?: { classId?: string | null; taskId?: string | null },
  ) => {
    try {
      if (!manualStartRef.current) {
        return;
      }
      manualStartRef.current = false;
      if (!authUser) {
        setIsLoginMenuOpen(true);
        return;
      }

      const effectiveClassId = overrides?.classId ?? selectedClassId;
      const effectiveTaskId = overrides?.taskId ?? selectedTaskId;

      if (!effectiveClassId || !effectiveTaskId) {
        setIsClassTaskModalOpen(true);
        return;
      }

      await doUploadMany(files, {
        classId: effectiveClassId,
        taskId: effectiveTaskId,
      });
      return;
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Erro inesperado ao enviar o arquivo.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const doUploadMany = async (
    files: File[],
    context?: { classId?: string | null; taskId?: string | null },
  ) => {
    await doBulkUpload(files, context);
  };

  const doBulkUpload = async (
    files: File[],
    context?: { classId?: string | null; taskId?: string | null },
  ) => {
    try {
      setIsUploading(true);
      clearResults();
      setError('');
      setUploadCompleted(false);
      setUploadStarted(true);

      const formData = new FormData();
      const normalizedFiles = files.map((file) => normalizeJpepgFile(file));
      normalizedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (normalizedFiles.length === 1) {
        setCachedFileName(normalizedFiles[0].name);
      }
      formData.append('document_type', documentType);
      formData.append('documentType', documentType);
      if (authUser) {
        formData.append('user_id', authUser.id);
      }
      const classId = context?.classId ?? selectedClassId;
      const taskId = context?.taskId ?? selectedTaskId;
      if (classId) {
        formData.append('class_id', classId);
      }
      if (taskId) {
        formData.append('task_id', taskId);
      }
      const payload = (await extractTextBulk(formData)) as BulkExtractionResponse;
      const total = payload.progress?.total ?? 0;
      const completed = payload.progress?.completed ?? 0;
      if (total > 0) {
        setBulkTotal(total);
        setBulkCompleted(completed);
      }
      setUploadCompleted(true);
      const updatedPlanUsage = persistPlanUsage(payload);
      if (updatedPlanUsage) {
        onPlanUsageUpdate?.(updatedPlanUsage);
      }

      if (payload.batch_id) {
        startBulkStream(payload.batch_id);
      }
      if (classId && taskId) {
        onExtractionComplete?.({ classId, taskId, mode: 'bulk' });
      }
    } catch (uploadError) {
      setUploadCompleted(false);
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Erro inesperado ao enviar os arquivos.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = () => {
    clearResults();
    setUploadCompleted(false);
    setUploadStarted(false);
  };

  const markManualStart = () => {
    manualStartRef.current = true;
  };

  return {
    isUploading,
    resultText,
    analysisText,
    error,
    setError,
    setResultText,
    setAnalysisText,
    clearResults,
    markManualStart,
    uploadFiles,
    doUploadMany,
    doBulkUpload,
    handleFileChange,
  };
};
