import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';

const MediaViewer = ({ isOpen, src, alt = '', onClose }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !src) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoom((current) => Math.max(1, current - 0.25));
              }}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoom((current) => Math.min(3, current + 0.25));
              }}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <a
              href={src}
              download
              onClick={(event) => event.stopPropagation()}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 pb-6 md:px-8">
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full origin-center object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
