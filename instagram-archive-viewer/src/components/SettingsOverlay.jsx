import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Clapperboard,
  Image as ImageIcon,
  Link as LinkIcon,
  LoaderCircle,
  MoreHorizontal,
  Search,
  Bell,
  User,
} from 'lucide-react';
import { getConversationMediaPage } from '../lib/sqliteClient';
import { resolveArchiveUri } from '../lib/messageAssets';

const TAB_CONFIG = {
  MEDIA: { label: 'Photos & videos', icon: ImageIcon },
  REELS: { label: 'Reels', icon: Clapperboard },
  LINKS: { label: 'Links', icon: LinkIcon },
};

const MEDIA_PAGE_SIZE = 30;

function MediaTile({ item }) {
  const assetUri = resolveArchiveUri(
    item.metadata?.attachments?.[0]?.uri || item.asset_uri || item.share_link,
  );
  const [loaded, setLoaded] = useState(false);

  if (item.type === 'photo' && assetUri) {
    return (
      <a
        href={assetUri}
        target="_blank"
        rel="noreferrer"
        className="relative flex aspect-square overflow-hidden rounded-2xl bg-zinc-900"
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-800" />}
        <img
          src={assetUri}
          alt=""
          loading="lazy"
          decoding="async"
          width="220"
          height="220"
          sizes="(max-width: 768px) 44vw, 18vw"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </a>
    );
  }

  return (
    <a
      href={assetUri || '#'}
      target={assetUri ? '_blank' : undefined}
      rel={assetUri ? 'noreferrer' : undefined}
      className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-zinc-900 px-3 text-center"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
        {item.type}
      </span>
      <span className="mt-2 line-clamp-4 text-[11px] text-zinc-300">{item.preview_text}</span>
    </a>
  );
}

// This panel mixes conversation settings with paged media views so large threads stay fast.
const SettingsOverlay = ({
  isOpen,
  onClose,
  recipient,
  ownerName,
  perspective,
  setPerspective,
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  themes = [],
  threadId,
}) => {
  const [tabItems, setTabItems] = useState({
    MEDIA: [],
    REELS: [],
    LINKS: [],
  });
  const [tabLoading, setTabLoading] = useState({
    MEDIA: false,
    REELS: false,
    LINKS: false,
  });
  const [tabHasMore, setTabHasMore] = useState({
    MEDIA: true,
    REELS: true,
    LINKS: true,
  });

  const gridRef = useRef(null);

  const activeItems = tabItems[activeTab] || [];

  useEffect(() => {
    if (!isOpen || !threadId) {
      return;
    }

    let isActive = true;

    async function loadInitialTabPages() {
      const tabs = ['MEDIA', 'REELS', 'LINKS'];

      for (const tab of tabs) {
        setTabLoading((current) => ({ ...current, [tab]: true }));
        try {
          const rows = await getConversationMediaPage(threadId, tab, null, MEDIA_PAGE_SIZE);
          if (!isActive) {
            return;
          }

          setTabItems((current) => ({ ...current, [tab]: rows }));
          setTabHasMore((current) => ({ ...current, [tab]: rows.length === MEDIA_PAGE_SIZE }));
        } catch {
          if (isActive) {
            setTabItems((current) => ({ ...current, [tab]: [] }));
            setTabHasMore((current) => ({ ...current, [tab]: false }));
          }
        } finally {
          if (isActive) {
            setTabLoading((current) => ({ ...current, [tab]: false }));
          }
        }
      }
    }

    loadInitialTabPages();

    return () => {
      isActive = false;
    };
  }, [isOpen, threadId]);

  async function loadMoreForActiveTab() {
    if (!threadId || tabLoading[activeTab] || !tabHasMore[activeTab] || activeItems.length === 0) {
      return;
    }

    const lastItem = activeItems[activeItems.length - 1];
    setTabLoading((current) => ({ ...current, [activeTab]: true }));

    try {
      const nextRows = await getConversationMediaPage(
        threadId,
        activeTab,
        lastItem.timestamp_ms,
        MEDIA_PAGE_SIZE,
      );

      setTabItems((current) => ({
        ...current,
        [activeTab]: [...current[activeTab], ...nextRows],
      }));
      setTabHasMore((current) => ({
        ...current,
        [activeTab]: nextRows.length === MEDIA_PAGE_SIZE,
      }));
    } catch {
      setTabHasMore((current) => ({ ...current, [activeTab]: false }));
    } finally {
      setTabLoading((current) => ({ ...current, [activeTab]: false }));
    }
  }

  const activeTabConfig = useMemo(() => TAB_CONFIG[activeTab], [activeTab]);
  const perspectiveOptions = [
    { id: 'owner', label: ownerName || 'You' },
    { id: 'other', label: recipient.name },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-end justify-center md:items-center md:p-6">
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-white/10 bg-black shadow-2xl sm:h-[94dvh] sm:rounded-t-3xl md:h-auto md:max-h-[92vh] md:w-[min(92vw,1080px)] md:rounded-3xl">
          <div className="flex items-center border-b border-zinc-900 bg-black p-4">
            <button onClick={onClose} className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold">Details</span>
          </div>

          <div className="app-scrollbar flex-1 overflow-y-auto">
            <div className="flex flex-col items-center px-6 pb-6 pt-8">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                {recipient.pfp ? (
                  <img src={recipient.pfp} className="h-full w-full object-cover" alt="" />
                ) : (
                  <User className="h-12 w-12 text-zinc-600" />
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight">{recipient.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{recipient.handle ? `@${recipient.handle}` : 'Instagram conversation'}</p>

              <div className="mt-8 grid w-full max-w-[320px] grid-cols-4 gap-4">
                {[
                  { icon: <User />, label: 'Profile' },
                  { icon: <Search />, label: 'Search' },
                  { icon: <Bell />, label: 'Mute' },
                  { icon: <MoreHorizontal />, label: 'Options' },
                ].map((btn) => (
                  <div key={btn.label} className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 transition-colors active:bg-zinc-900">
                      {React.cloneElement(btn.icon, { className: 'w-5 h-5' })}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300">{btn.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 px-5 py-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-bold">View Perspective</span>
                <span className="text-[10px] font-black uppercase text-zinc-500">
                  {perspectiveOptions.find((option) => option.id === perspective)?.label || recipient.name}
                </span>
              </div>
              <div className="flex rounded-xl border border-zinc-800 bg-[#121212] p-1">
                {perspectiveOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPerspective(option.id)}
                    className={`flex-1 rounded-lg px-3 py-2.5 text-[11px] font-black uppercase transition-all ${
                      perspective === option.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 opacity-50'
                    }`}
                  >
                    <span className="block truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 px-5 py-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-bold">Chat Theme</span>
                <span className="text-[10px] font-black uppercase text-zinc-500">
                  {themes.find((option) => option.id === theme)?.label || 'Custom'}
                </span>
              </div>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
                {[
                  { id: 'sunset', swatch: 'from-[#2a0000] via-[#511010] to-[#ff5a2f]' },
                  { id: 'classic', swatch: 'from-[#111111] via-[#1d1d1f] to-[#303030]' },
                  { id: 'ocean', swatch: 'from-[#051937] via-[#003f5c] to-[#2f80ed]' },
                  { id: 'monochrome', swatch: 'from-[#050505] via-[#1f1f1f] to-[#8a8a8a]' },
                  { id: 'aurora', swatch: 'from-[#180d29] via-[#4b1d6b] to-[#ff5ca8]' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition md:block ${
                      theme === option.id ? 'border-white/40 bg-white/8' : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br md:h-16 md:w-full ${option.swatch}`} />
                    <div className="min-w-0 text-xs font-semibold text-white md:mt-2">
                      {themes.find((themeOption) => themeOption.id === option.id)?.label || option.id}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 px-4 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                {Object.entries(TAB_CONFIG).map(([tab, config]) => {
                  const Icon = config.icon;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[12px] font-semibold transition ${
                        activeTab === tab ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-zinc-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={gridRef}
              onScroll={(event) => {
                const element = event.currentTarget;
                if (element.scrollTop + element.clientHeight >= element.scrollHeight - 120) {
                  loadMoreForActiveTab();
                }
              }}
              className="app-scrollbar max-h-[42dvh] overflow-y-auto p-4 pb-20"
            >
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {React.createElement(activeTabConfig.icon, { className: 'h-4 w-4' })}
                <span>{activeTabConfig.label}</span>
              </div>

              {activeItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {activeItems.map((item) => (
                    <MediaTile key={`${item.type}-${item.timestamp_ms}-${item.asset_uri || item.share_link}`} item={item} />
                  ))}
                </div>
              ) : !tabLoading[activeTab] ? (
                <div className="flex min-h-[180px] items-center justify-center text-sm text-zinc-500">
                  No {activeTab.toLowerCase()} found in this conversation yet.
                </div>
              ) : null}

              {tabLoading[activeTab] && (
                <div className="mt-4 flex items-center justify-center">
                  <LoaderCircle className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsOverlay;
