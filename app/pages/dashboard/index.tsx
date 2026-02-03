"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ClassTaskModal from "../../components/ClassTaskModal";

const documentTypeMap = {
  pdf_native: "PDF Nativo",
  printed: "Documento impresso",
  handwritten: "Texto escrito à mão",
  auto: "Detectar automaticamente"
} as const;

type DocumentTypeKey = keyof typeof documentTypeMap;

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [error, setError] = useState("");
  const [debugPayload, setDebugPayload] = useState<Record<string, unknown> | null>(
    null
  );
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; name: string } | null>(
    null
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [analysisCacheKey, setAnalysisCacheKey] = useState<string | null>(null);
  const [cachedFileName, setCachedFileName] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const bulkStreamRef = useRef<EventSource | null>(null);
  const manualStartRef = useRef(false);
  const documentTypes = useMemo(
    () => Object.entries(documentTypeMap) as [DocumentTypeKey, string][],
    []
  );
  const [documentType, setDocumentType] = useState<DocumentTypeKey>("auto");

  // Class and Task modal states
  const [isClassTaskModalOpen, setIsClassTaskModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string | null>(null);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCompleted, setBulkCompleted] = useState(0);

  const isBulkInProgress = bulkTotal > 0 && bulkCompleted < bulkTotal;

  const handleClassTaskModalConfirm = (data: {
    classId: string;
    taskId: string;
    className?: string;
    taskTitle?: string;
  }) => {
    setSelectedClassId(data.classId);
    setSelectedTaskId(data.taskId);
    setSelectedClassName(data.className ?? null);
    setSelectedTaskTitle(data.taskTitle ?? null);
    setIsClassTaskModalOpen(false);
    manualStartRef.current = true;
    uploadFiles(selectedFiles, {
      classId: data.classId,
      taskId: data.taskId,
    });
  };

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

  useEffect(() => {
    if (!isTypeMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        typeMenuRef.current &&
        event.target instanceof Node &&
        !typeMenuRef.current.contains(event.target)
      ) {
        setIsTypeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTypeMenuOpen]);

  useEffect(() => {
    if (!isLoginMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        loginMenuRef.current &&
        event.target instanceof Node &&
        !loginMenuRef.current.contains(event.target)
      ) {
        setIsLoginMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoginMenuOpen]);

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      return;
    }
    const storedName = localStorage.getItem("sessionUserName");
    const storedUserId = localStorage.getItem("sessionUserId");
    if (!storedUserId) {
      return;
    }
    setAuthUser({ id: storedUserId, name: storedName || "Usuario" });
  }, []);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        resolve(result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const hashString = async (value: string): Promise<string> => {
    const data = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const getAnalysisCacheKey = async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);
    const hash = await hashString(base64);
    return `extract:${hash.slice(0, 32)}`;
  };

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Wait for explicit user action to start processing after login.

  const handleAuth = async (mode: "sign-in" | "sign-up") => {
    try {
      setAuthLoading(true);
      setAuthError("");

      const response = await fetch(`http://localhost:3001/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: mode === "sign-up" ? authName.trim() : undefined,
          email: authEmail.trim(),
          password: authPassword
        })
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error || "Falha ao autenticar.");
      }

      const payload = (await response.json()) as {
        user?: { id?: string; name?: string };
        token?: string;
      };
      const userName = payload.user?.name || "Usuario";
      const userId = payload.user?.id || "user_unknown";
      setAuthUser({ id: userId, name: userName });
      if (payload.token) {
        localStorage.setItem("sessionToken", payload.token);
        localStorage.setItem("sessionUserName", userName);
        localStorage.setItem("sessionUserId", userId);
      }
      setError("");
      setIsLoginMenuOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado ao autenticar.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const fileLabel = useMemo(() => {
    if (selectedFiles.length === 0 && !cachedFileName) {
      return "Arraste os arquivos aqui";
    }

    if (selectedFiles.length === 1) {
      return `Arquivo selecionado: ${selectedFiles[0].name}`;
    }

    if (selectedFiles.length > 1) {
      return `Arquivos selecionados: ${selectedFiles.length}`;
    }

    return `Arquivo selecionado: ${cachedFileName ?? ""}`;
  }, [selectedFiles, cachedFileName]);

  const bulkProgressPercent = useMemo(() => {
    if (bulkTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((bulkCompleted / bulkTotal) * 100));
  }, [bulkCompleted, bulkTotal]);

  const closeBulkStream = () => {
    if (bulkStreamRef.current) {
      bulkStreamRef.current.close();
      bulkStreamRef.current = null;
    }
  };

  const startBulkStream = (batchId: string) => {
    closeBulkStream();
    const token = localStorage.getItem("sessionToken");
    const streamUrl = new URL(
      `http://localhost:3001/extractions/bulk/${batchId}/events`
    );
    if (token) {
      streamUrl.searchParams.set("token", token);
    }

    const eventSource = new EventSource(streamUrl.toString());
    bulkStreamRef.current = eventSource;

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

    eventSource.addEventListener("status", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          progress?: { completed?: number; total?: number };
        };
        updateProgressFromPayload(payload);
      } catch (streamError) {
        console.error("Failed to parse SSE payload", streamError);
      }
    });

    eventSource.addEventListener("done", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          progress?: { completed?: number; total?: number };
        };
        updateProgressFromPayload(payload);
      } catch (streamError) {
        console.error("Failed to parse SSE done payload", streamError);
      } finally {
        closeBulkStream();
      }
    });

    eventSource.addEventListener("error", () => {
      closeBulkStream();
    });
  };

  const validExtensions = [".pdf", ".png", ".jpeg", ".jpg", ".jpepg"];

  const getFileKey = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`;

  const mergeFiles = (current: File[], incoming: File[]) => {
    const map = new Map<string, File>();
    current.forEach((file) => map.set(getFileKey(file), file));
    incoming.forEach((file) => map.set(getFileKey(file), file));
    return Array.from(map.values());
  };

  const addFiles = (incoming: File[]) => {
    const validFiles = incoming.filter((file) => {
      const fileName = file.name.toLowerCase();
      return validExtensions.some((ext) => fileName.endsWith(ext));
    });

    if (validFiles.length === 0) {
      setError("Tipo de arquivo não suportado. Use PDF, PNG, JPG ou JPEG.");
      return selectedFiles;
    }

    if (validFiles.length !== incoming.length) {
      setError("Alguns arquivos foram ignorados por formato inválido.");
    }

    return mergeFiles(selectedFiles, validFiles);
  };

  const removeSelectedFile = (fileKey: string) => {
    const nextFiles = selectedFiles.filter((file) => getFileKey(file) !== fileKey);
    setSelectedFiles(nextFiles);
    setPendingFiles((current) => current.filter((file) => getFileKey(file) !== fileKey));
    if (nextFiles.length === 0) {
      setResultText("");
      setAnalysisText("");
      setDebugPayload(null);
      setCachedFileName(null);
      setBulkTotal(0);
      setBulkCompleted(0);
      closeBulkStream();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    const nextFiles = addFiles(files);
    setSelectedFiles(nextFiles);
    setResultText("");
    setAnalysisText("");
    setDebugPayload(null);
    // Wait for explicit user action to start processing.
  };

  const uploadFiles = async (
    files: File[],
    overrides?: { classId?: string | null; taskId?: string | null }
  ) => {
    try {
      if (!manualStartRef.current) {
        return;
      }
      manualStartRef.current = false;
      if (!authUser) {
        setIsLoginMenuOpen(true);
        setPendingFiles(files);
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
        uploadError instanceof Error
          ? uploadError.message
          : "Erro inesperado ao enviar o arquivo.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const doUploadMany = async (
    files: File[],
    context?: { classId?: string | null; taskId?: string | null }
  ) => {
    if (files.length > 1) {
      await doBulkUpload(files, context);
      return;
    }
    await doUpload(files[0], context);
  };

  const doBulkUpload = async (
    files: File[],
    context?: { classId?: string | null; taskId?: string | null }
  ) => {
    try {
      setIsUploading(true);
      setError("");
      setResultText("");
      setAnalysisText("");
      setDebugPayload(null);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("document_type", documentType);
      if (authUser) {
        formData.append("user_id", authUser.id);
      }
      const classId = context?.classId ?? selectedClassId;
      const taskId = context?.taskId ?? selectedTaskId;
      if (classId) {
        formData.append("class_id", classId);
      }
      if (taskId) {
        formData.append("task_id", taskId);
      }
      const token = localStorage.getItem("sessionToken");
      const response = await fetch("http://localhost:3001/extractions/bulk", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Falha ao enviar os arquivos.");
      }

      const payload = (await response.json()) as {
        batch_id?: string;
        progress?: { completed?: number; total?: number };
      };
      const total = payload.progress?.total ?? 0;
      const completed = payload.progress?.completed ?? 0;
      if (total > 0) {
        setBulkTotal(total);
        setBulkCompleted(completed);
      }

      if (payload.batch_id) {
        startBulkStream(payload.batch_id);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Erro inesperado ao enviar os arquivos.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const doUpload = async (
    file: File,
    context?: { classId?: string | null; taskId?: string | null }
  ) => {
    try {
      setIsUploading(true);
      setError("");
      setResultText("");
      setAnalysisText("");
      setDebugPayload(null);

      const normalizedFile = file.name.toLowerCase().endsWith(".jpepg")
        ? new File([file], file.name.replace(/\.jpepg$/i, ".jpeg"), {
            type: file.type || "image/jpeg"
          })
        : file;
      const cacheKey = await getAnalysisCacheKey(normalizedFile);
      setAnalysisCacheKey(cacheKey);
      setCachedFileName(normalizedFile.name);
      const cachedPayload = localStorage.getItem(cacheKey);
      if (cachedPayload !== null) {
        const cached = JSON.parse(cachedPayload as string) as Record<string, unknown> & {
          text?: string;
          analysis?: string;
          metadata?: { original_filename?: string };
        };
        const restoredFileName = cached.metadata?.original_filename;
        setCachedFileName(restoredFileName || normalizedFile.name);
        setResultText(
          typeof cached.text === "string" && cached.text.trim().length > 0
            ? cached.text
            : "Nenhum texto retornado."
        );
        const cachedAnalysis =
          typeof cached.analysis === "string"
            ? cached.analysis
            : cached.analysis !== undefined
            ? JSON.stringify(cached.analysis, null, 2)
            : "";
        setAnalysisText(
          cachedAnalysis.trim().length > 0 ? cachedAnalysis : ""
        );
        if (process.env.NODE_ENV === "development") {
          const { text, analysis, analysis_text, analysisText, ...rest } =
            cached as {
              text?: unknown;
              analysis?: unknown;
              analysis_text?: unknown;
              analysisText?: unknown;
            };
          setDebugPayload(rest);
        }
        return;
      }

      const formData = new FormData();
      formData.append("file", normalizedFile);
      formData.append("documentType", documentType);
      if (authUser) {
        formData.append("user_id", authUser.id);
      }
      const classId = context?.classId ?? selectedClassId;
      const taskId = context?.taskId ?? selectedTaskId;
      if (classId) {
        formData.append("class_id", classId);
      }
      if (taskId) {
        formData.append("task_id", taskId);
      }
      const token = localStorage.getItem("sessionToken");
      const response = await fetch("http://localhost:3001/extract-text", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Falha ao extrair o texto.");
      }

      const payload = (await response.json()) as Record<string, unknown> & {
        text?: string;
        analysis?: string;
      };
      setResultText(
        typeof payload.text === "string" && payload.text.trim().length > 0
          ? payload.text
          : "Nenhum texto retornado."
      );
      const analysisValue =
        typeof payload.analysis === "string"
          ? payload.analysis
          : payload.analysis !== undefined
          ? JSON.stringify(payload.analysis, null, 2)
          : "";
      const trimmedAnalysis =
        analysisValue.trim().length > 0 ? analysisValue : "";
      setAnalysisText(trimmedAnalysis);
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      }
      if (process.env.NODE_ENV === "development") {
        const { text, analysis, analysis_text, analysisText, ...rest } = payload as {
          text?: unknown;
          analysis?: unknown;
          analysis_text?: unknown;
          analysisText?: unknown;
        };
        setDebugPayload(rest);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Erro inesperado ao enviar o arquivo.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const nextFiles = addFiles(Array.from(files));
      setSelectedFiles(nextFiles);
      setResultText("");
      setAnalysisText("");
      setDebugPayload(null);
      // Wait for explicit user action to start processing.
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-6 py-12">
      <div className="absolute right-6 top-6 z-10" ref={loginMenuRef}>
        {authUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
            >
              {authUser.name}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 text-blue-500"
                fill="currentColor"
              >
                <path d="M5.5 7.5 10 12l4.5-4.5" />
              </svg>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl border border-blue-100 bg-white p-2 shadow-lg">
                {["Perfil", "Minhas turmas", "Sair"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (label === "Sair") {
                        setAuthUser(null);
                        localStorage.removeItem("sessionToken");
                        localStorage.removeItem("sessionUserName");
                        localStorage.removeItem("sessionUserId");
                      }
                      if (label === "Minhas turmas") {
                        window.location.href = "/classes";
                      }
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 transition hover:bg-blue-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLoginMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
          >
            Entrar
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 text-blue-500"
              fill="currentColor"
            >
              <path d="M5.5 7.5 10 12l4.5-4.5" />
            </svg>
          </button>
        )}

        {isLoginMenuOpen && !authUser && (
          <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-blue-100 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-3 text-sm font-semibold text-blue-700">
              <button
                type="button"
                onClick={() => setAuthMode("sign-in")}
                className={`flex-1 pb-2 text-center ${
                  authMode === "sign-in"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-gray-400"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("sign-up")}
                className={`flex-1 pb-2 text-center ${
                  authMode === "sign-up"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-gray-400"
                }`}
              >
                Cadastrar
              </button>
            </div>
            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleAuth(authMode);
              }}
            >
              {authMode === "sign-up" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="********"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="mt-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {authLoading
                  ? "Enviando..."
                  : authMode === "sign-in"
                  ? "Entrar"
                  : "Cadastrar"}
              </button>
              {authError && (
                <span className="text-center text-xs text-red-500">
                  {authError}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleAuth("sign-in")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </button>
            </form>
          </div>
        )}
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
        <header className="flex w-full flex-col items-center text-center">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Corrige Aí
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 sm:text-4xl">
            Revisão inteligente para documentos que precisam de atenção
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Arraste seus arquivos para uma área segura e deixe a IA apontar o
            que precisa de correção, padrão ou validação.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              "Correção guiada",
              "Resumo instantâneo",
              "Uploads seguros"
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-medium text-blue-700 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-10 flex w-full flex-col gap-6">
          <aside className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Como funciona
              </h3>
              <ul className="mt-4 space-y-4 text-sm text-gray-600">
                {[
                  "Envie documentos em lote para analise automatizada.",
                  "Receba sugestoes de correcao e padronizacao.",
                  "Exportacao rapida em relatorios claros."
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              <strong className="font-semibold">Dica:</strong> combine arquivos
              de multiplas fontes e deixe o Corrige Ai indicar inconsistencias
              automaticamente.
            </div>
          </aside>

          <div className="w-full">
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Área de revisão
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Arraste e solte fotos ou documentos de texto para análise.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5-5 5 5" />
                    <path d="M12 5v12" />
                  </svg>
                </div>
              </div>

            <label
              htmlFor="file-upload"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center text-sm transition ${
                isDragging
                  ? "border-blue-500 bg-blue-200 text-blue-800"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
              }`}
            >
              <span className="font-semibold">{fileLabel}</span>
              <span className="mt-1 text-xs text-blue-600">
                ou clique para selecionar do seu computador
              </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".pdf,.png,.jpeg,.jpg,.jpepg"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-4 w-full">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file) => {
                    const fileKey = getFileKey(file);
                    return (
                      <span
                        key={fileKey}
                        className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs text-gray-700"
                      >
                        <span className="max-w-[220px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(fileKey)}
                          className="text-gray-400 transition hover:text-red-500"
                          aria-label={`Remover ${file.name}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
                {bulkTotal > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progresso da extração</span>
                      <span>{bulkProgressPercent}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${bulkProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-gray-500">
                Até 20MB por arquivo. Suporte para PDF, PNG, JPG e JPEG.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <div className="relative" ref={typeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsTypeMenuOpen((open) => !open)}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-blue-300"
                    >
                      {documentType
                        ? documentTypeMap[documentType]
                        : "Selecionar tipo de documento"}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-3.5 w-3.5 text-blue-500"
                        fill="currentColor"
                      >
                        <path d="M5.5 7.5 10 12l4.5-4.5" />
                      </svg>
                    </button>
                    {isTypeMenuOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-64 max-h-56 overflow-y-auto rounded-xl border border-blue-100 bg-white p-2 shadow-lg">
                        {documentTypes.map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setDocumentType(key);
                              setIsTypeMenuOpen(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-blue-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFiles.length === 0) {
                      return;
                    }
                    if (!selectedClassId || !selectedTaskId) {
                      setIsClassTaskModalOpen(true);
                      return;
                    }
                    manualStartRef.current = true;
                    uploadFiles(selectedFiles);
                  }}
                  disabled={
                    selectedFiles.length === 0 ||
                    !documentType ||
                    isUploading ||
                    isBulkInProgress
                  }
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isUploading || isBulkInProgress ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                      Processando...
                    </span>
                  ) : (
                    "Iniciar revisao"
                  )}
                </button>
              </div>
            </div>

              {authUser && selectedFiles.length > 0 && (resultText || analysisText || error) && (
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Comparacao lado a lado
                    </h3>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-blue-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Original
                        </p>
                        {selectedFiles.length === 1 &&
                          previewUrl &&
                          selectedFiles[0]?.type !== "application/pdf" && (
                          <button
                            type="button"
                            onClick={() => setIsZoomed(true)}
                            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300"
                          >
                            Ver zoom
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex min-h-[400px] items-center justify-center rounded-md bg-gray-50 p-3">
                        {previewUrl ? (
                          selectedFiles.length === 1 &&
                          selectedFiles[0]?.type === "application/pdf" ? (
                            <iframe
                              title="preview"
                              src={previewUrl}
                              className="h-96 w-full rounded-md border border-gray-200 bg-white"
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              alt={selectedFiles[0]?.name || "Arquivo enviado"}
                              className="max-h-96 w-auto rounded-md object-contain"
                            />
                          )
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Texto extraido
                      </p>
                      <div className="mt-3 min-h-[400px] max-h-[400px] overflow-y-auto rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                        {error ? (
                          <span className="text-red-600">{error}</span>
                        ) : resultText ? (
                          <p className="whitespace-pre-line">{resultText}</p>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Aguarde a extracao do texto.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysisText && (
                    <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Analise do texto
                      </p>
                      <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                        {analysisText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isZoomed &&
        selectedFiles.length === 1 &&
        previewUrl &&
        selectedFiles[0]?.type !== "application/pdf" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
            >
              Fechar
            </button>
            <img
              src={previewUrl}
              alt={selectedFiles[0]?.name || "Arquivo enviado"}
              className="mx-auto max-h-[75vh] w-auto rounded-md object-contain"
            />
          </div>
        </div>
      )}

      <ClassTaskModal
        isOpen={isClassTaskModalOpen}
        onClose={() => {
          setIsClassTaskModalOpen(false);
        }}
        onConfirm={handleClassTaskModalConfirm}
        userId={authUser?.id}
        preSelectedClassId={selectedClassId ?? undefined}
        preSelectedTaskId={selectedTaskId ?? undefined}
      />

    </main>
  );
}
