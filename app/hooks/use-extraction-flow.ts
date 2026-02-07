import { useRef, useState } from 'react';

import {
  extractText,
  extractTextBulk,
  type BulkExtractionResponse,
} from '../services/extractions-service';
import {
  getAnalysisCacheKey,
  normalizeJpepgFile,
  parseCachedExtractionPayload,
} from '../helpers/file-helpers';

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
  onExtractionComplete?: (payload: {
    classId: string;
    taskId: string;
    mode: 'single' | 'bulk';
  }) => void;
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
    resetBulkProgress,
    onExtractionComplete,
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
    if (files.length > 1) {
      await doBulkUpload(files, context);
      return;
    }
    await doUpload(files[0], context);
  };

  const doBulkUpload = async (
    files: File[],
    context?: { classId?: string | null; taskId?: string | null },
  ) => {
    try {
      setIsUploading(true);
      clearResults();
      setError('');

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
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

      if (payload.batch_id) {
        startBulkStream(payload.batch_id);
      }
      if (classId && taskId) {
        onExtractionComplete?.({ classId, taskId, mode: 'bulk' });
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Erro inesperado ao enviar os arquivos.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const doUpload = async (
    file: File,
    context?: { classId?: string | null; taskId?: string | null },
  ) => {
    try {
      setIsUploading(true);
      clearResults();
      setError('');

      const normalizedFile = normalizeJpepgFile(file);
      const cacheKey = await getAnalysisCacheKey(normalizedFile);
      setCachedFileName(normalizedFile.name);
      const cachedPayload = localStorage.getItem(cacheKey);
      if (cachedPayload !== null) {
        const cached = parseCachedExtractionPayload(cachedPayload);
        setCachedFileName(cached.cachedFileName || normalizedFile.name);
        setResultText(cached.resultText);
        setAnalysisText(cached.analysisText);
        return;
      }

      const formData = new FormData();
      formData.append('file', normalizedFile);
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
      const payload = (await extractText(formData)) as Record<string, unknown> & {
        text?: string;
        analysis?: string;
      };
      setResultText(
        typeof payload.text === 'string' && payload.text.trim().length > 0
          ? payload.text
          : 'Nenhum texto retornado.',
      );
      const analysisValue =
        typeof payload.analysis === 'string'
          ? payload.analysis
          : payload.analysis !== undefined
            ? JSON.stringify(payload.analysis, null, 2)
            : '';
      const trimmedAnalysis = analysisValue.trim().length > 0 ? analysisValue : '';
      setAnalysisText(trimmedAnalysis);
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      }
      if (classId && taskId) {
        onExtractionComplete?.({ classId, taskId, mode: 'single' });
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Erro inesperado ao enviar o arquivo.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = () => {
    clearResults();
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
    doUpload,
    handleFileChange,
  };
};
