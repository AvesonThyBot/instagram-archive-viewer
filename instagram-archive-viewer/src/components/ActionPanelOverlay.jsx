import { ChevronLeft } from 'lucide-react';

// Reusable mobile-first sheet shell for inbox side panels such as settings, wrapped, and export.
const ActionPanelOverlay = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[64] bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-end justify-center md:items-center md:p-6">
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-white/10 bg-[#0f1218] shadow-2xl sm:h-[94dvh] sm:rounded-t-3xl md:h-auto md:max-h-[84vh] md:w-[min(92vw,720px)] md:rounded-3xl">
          <div className="flex items-center border-b border-white/10 px-4 py-4">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-white/55">{description}</p> : null}
            </div>
          </div>

          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPanelOverlay;
