export const DEFAULT_VALID_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg', '.jpepg'];
export const DEFAULT_VALID_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const hashString = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getAnalysisCacheKey = async (file: File): Promise<string> => {
  const base64 = await fileToBase64(file);
  const hash = await hashString(base64);
  return `extract:${hash.slice(0, 32)}`;
};

export const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export const mergeFiles = (current: File[], incoming: File[]) => {
  const map = new Map<string, File>();
  current.forEach((file) => map.set(getFileKey(file), file));
  incoming.forEach((file) => map.set(getFileKey(file), file));
  return Array.from(map.values());
};

export const filterValidFiles = (
  incoming: File[],
  extensions = DEFAULT_VALID_EXTENSIONS,
  mimeTypes = DEFAULT_VALID_MIME_TYPES,
) => {
  const validFiles = incoming.filter((file) => {
    const fileName = file.name.toLowerCase();
    const matchesExtension = extensions.some((ext) => fileName.endsWith(ext));
    const matchesMime = Boolean(file.type) && mimeTypes.includes(file.type);
    return matchesExtension || matchesMime;
  });
  return {
    validFiles,
    hasInvalid: validFiles.length !== incoming.length,
  };
};

export const normalizeJpepgFile = (file: File) => {
  if (!file.name.toLowerCase().endsWith('.jpepg')) {
    return file;
  }
  return new File([file], file.name.replace(/\.jpepg$/i, '.jpeg'), {
    type: file.type || 'image/jpeg',
  });
};

export const parseCachedExtractionPayload = (cachedPayload: string) => {
  const cached = JSON.parse(cachedPayload) as Record<string, unknown> & {
    text?: string;
    analysis?: string;
    metadata?: { original_filename?: string };
  };

  const cachedFileName = cached.metadata?.original_filename;
  const resultText =
    typeof cached.text === 'string' && cached.text.trim().length > 0
      ? cached.text
      : 'Nenhum texto retornado.';
  const analysisText =
    typeof cached.analysis === 'string'
      ? cached.analysis
      : cached.analysis !== undefined
        ? JSON.stringify(cached.analysis, null, 2)
        : '';

  return {
    cachedFileName,
    resultText,
    analysisText: analysisText.trim().length > 0 ? analysisText : '',
    raw: cached,
  };
};
