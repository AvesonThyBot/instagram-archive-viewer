import { ChevronLeft, Heart } from 'lucide-react';

function formatFavouriteTime(timestampMs) {
  return new Date(timestampMs).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Favourites stay lightweight and local so users can jump back into important moments quickly.
const FavouritesOverlay = ({ isOpen, onClose, favourites, onSelectMessage }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-end justify-center md:items-center md:p-6">
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-white/10 bg-[#0b0e13] shadow-2xl sm:h-[94dvh] sm:rounded-t-3xl md:h-auto md:max-h-[86vh] md:w-[min(92vw,760px)] md:rounded-3xl">
          <div className="flex items-center border-b border-white/10 px-4 py-4">
            <button onClick={onClose} className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold text-white">Favourites</span>
          </div>

          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {favourites.length > 0 ? (
              <div className="space-y-3">
                {favourites.map((message) => (
                  <button
                    key={message.message_id}
                    type="button"
                    onClick={() => onSelectMessage?.(message.message_id)}
                    className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{message.sender_name}</p>
                        <p className="text-xs text-white/55">{formatFavouriteTime(message.timestamp_ms)}</p>
                      </div>
                      <Heart className="h-5 w-5 shrink-0 fill-[#ff5a7a] text-[#ff5a7a]" />
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-white/85">
                      {message.text_content || message.preview_text}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-white/55">
                Favourite messages will show here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavouritesOverlay;
