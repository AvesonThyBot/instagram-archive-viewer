import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';

// Full-screen media viewer keeps zoom and download actions close on both desktop and mobile.
const MediaViewer = ({ isOpen, src, alt = '', onClose }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !src) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white md:h-11 md:w-11"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoom((current) => Math.max(1, current - 0.25));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white md:h-11 md:w-11"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoom((current) => Math.min(3, current + 0.25));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white md:h-11 md:w-11"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <a
              href={src}
              download
              onClick={(event) => event.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white md:h-11 md:w-11"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="app-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-auto px-3 pb-4 md:px-8 md:pb-6">
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
