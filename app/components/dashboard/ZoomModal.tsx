'use client';

type ZoomModalProps = {
  isOpen: boolean;
  previewUrl: string | null;
  fileName: string | null;
  onClose: () => void;
};

export const ZoomModal = ({ isOpen, previewUrl, fileName, onClose }: ZoomModalProps) => {
  if (!isOpen || !previewUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-4 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
        >
          Fechar
        </button>
        <img
          src={previewUrl}
          alt={fileName || 'Arquivo enviado'}
          className="mx-auto max-h-[75vh] w-auto rounded-md object-contain"
        />
      </div>
    </div>
  );
};
