import { useEffect, useState } from 'react';

export const useFilePreview = (selectedFiles: File[]) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const activeFile = selectedFiles[0];
    if (!activeFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(activeFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFiles]);

  return previewUrl;
};
