import { useMemo, useState } from 'react';

import {
  DEFAULT_VALID_EXTENSIONS,
  filterValidFiles,
  getFileKey,
  mergeFiles,
} from '../helpers/file-helpers';

export const useFileSelection = (onError?: (message: string) => void) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cachedFileName, setCachedFileName] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileLabel = useMemo(() => {
    if (selectedFiles.length === 0 && !cachedFileName) {
      return 'Arraste os arquivos aqui';
    }

    if (selectedFiles.length === 1) {
      return `Arquivo selecionado: ${selectedFiles[0].name}`;
    }

    if (selectedFiles.length > 1) {
      return `Arquivos selecionados: ${selectedFiles.length}`;
    }

    return `Arquivo selecionado: ${cachedFileName ?? ''}`;
  }, [selectedFiles, cachedFileName]);

  const addFiles = (incoming: File[]) => {
    const { validFiles, hasInvalid } = filterValidFiles(incoming, DEFAULT_VALID_EXTENSIONS);
    if (validFiles.length === 0) {
      const message = 'Tipo de arquivo não suportado. Use PDF, PNG, JPG ou JPEG.';
      setError(message);
      onError?.(message);
      return selectedFiles;
    }

    if (hasInvalid) {
      const message = 'Alguns arquivos foram ignorados por formato inválido.';
      setError(message);
      onError?.(message);
    }

    return mergeFiles(selectedFiles, validFiles);
  };

  const removeSelectedFile = (fileKey: string) => {
    const nextFiles = selectedFiles.filter((file) => getFileKey(file) !== fileKey);
    setSelectedFiles(nextFiles);
    return nextFiles;
  };

  return {
    selectedFiles,
    setSelectedFiles,
    cachedFileName,
    setCachedFileName,
    fileLabel,
    addFiles,
    removeSelectedFile,
    selectionError: error,
    setSelectionError: setError,
  };
};
