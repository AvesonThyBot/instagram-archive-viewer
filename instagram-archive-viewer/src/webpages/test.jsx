import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MessageCircle, Play, RefreshCcw, AlertCircle } from 'lucide-react';
import { getLatestSharedReel } from '../lib/sqliteClient';

const FALLBACK_REEL_URL = 'https://www.instagram.com/reel/DVO50Cwj-vo/';

/* ---- Ensure the URL is clean and ends with a slash ---- */
function normalizeInstagramUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    /* ---- Remove query params like ?igsh=... which can break embeds ---- */
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '') + '/';
  } catch {
    return url.trim().replace(/\/+$/, '') + '/';
  }
}

/* ---- Build the Official Instagram Embed URL ---- */
function buildInstagramEmbedUrl(url) {
  const normalized = normalizeInstagramUrl(url);
  if (!normalized) return '';
  /* ---- Appending /embed/ is the standard for iframes ---- */
  return `${normalized}embed/`;
}

function formatTimestamp(timestampMs) {
  if (!timestampMs) return '';
  return new Date(timestampMs).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const Test = () => {
  const [reelData, setReelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadReel() {
      try {
        const nextReel = await getLatestSharedReel();
        if (!isActive) return;
        setReelData(nextReel);
      } catch (err) {
        console.error("Reel Load Error:", err);
        if (isActive) {
          setError('Could not access the SQLite database to find a reel.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadReel();
    return () => { isActive = false; };
  }, []);

  const shareLink = reelData?.share_link || FALLBACK_REEL_URL;
  
  /* ---- We use the official embed path now for better iframe support ---- */
  const embedUrl = useMemo(() => buildInstagramEmbedUrl(shareLink), [shareLink]);
  
  const shareDetails = reelData?.metadata?.raw?.share || {};
  const shareText = shareDetails.share_text || reelData?.preview_text || '';
  const originalOwner = shareDetails.original_content_owner || '';
  const reactions = reelData?.metadata?.raw?.reactions || [];

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,112,67,0.18),_transparent_28%),linear-gradient(180deg,#090909_0%,#111111_100%)] px-5 py-8 text-white md:px-8 md:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        
        {/* ---- Main Content: The Embed ---- */}
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-black/55 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">Instagram Archive</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Reel Preview</h1>
            </div>
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/82 transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open on Instagram</span>
            </a>
          </div>

          <div className="p-3 md:p-4">
            {isLoading ? (
              <div className="flex aspect-[9/16] max-h-[750px] items-center justify-center rounded-[28px] bg-white/[0.04] text-white/65">
                <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />
                Loading archive database...
              </div>
            ) : error ? (
              <div className="flex aspect-[9/16] max-h-[750px] flex-col items-center justify-center rounded-[28px] bg-red-500/5 px-6 text-center text-red-200/70">
                <AlertCircle className="mb-3 h-8 w-8" />
                <p>{error}</p>
              </div>
            ) : (
              <div className="relative aspect-[9/16] max-h-[750px] w-full overflow-hidden rounded-[28px] bg-black">
                {/* ---- The Iframe ---- */}
                <iframe
                  title="Instagram reel embed"
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  allowTransparency="true"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>

        {/* ---- Sidebar: Metadata ---- */}
        <aside className="h-fit rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff8a65]/30 bg-[#ff8a65]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffb199]">
            <Play className="h-3.5 w-3.5" />
            Metadata
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-white/50">Sender</p>
              <p className="mt-1 text-lg font-semibold">{reelData?.sender_name || 'System Fallback'}</p>
            </div>

            <div>
              <p className="text-sm text-white/50">Timestamp</p>
              <p className="mt-1 text-lg font-semibold">{formatTimestamp(reelData?.timestamp_ms) || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-white/50">Original Owner</p>
              <p className="mt-1 text-lg font-semibold">{originalOwner || 'Unknown'}</p>
            </div>

            <hr className="border-white/5" />

            <div>
              <p className="text-sm text-white/50">Shared Text</p>
              <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/84">
                {shareText || 'No caption available.'}
              </div>
            </div>

            {reactions.length > 0 && (
              <div>
                <p className="text-sm text-white/50">Reactions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reactions.map((r, i) => (
                    <span key={i} className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs">
                      {r.reaction} <span className="ml-1 opacity-50">{r.actor}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-blue-500/5 p-4 text-[12px] leading-relaxed text-blue-200/60">
              <p>Note: Private Reels will not load in the preview above. You must be logged into Instagram in this browser to see them via the official link.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Test;