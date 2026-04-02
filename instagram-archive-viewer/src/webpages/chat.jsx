import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Heart,
  LoaderCircle,
  Palette,
  Search,
  UserRound,
} from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import MediaViewer from '../components/MediaViewer';
import SettingsOverlay from '../components/SettingsOverlay';
import FavouritesOverlay from '../components/FavouritesOverlay';
import SearchOverlay from '../components/SearchOverlay';
import {
  getConversationMessagePage,
  getMessageContext,
  getMessagesNewerThan,
} from '../lib/sqliteClient';
import { resolveArchiveUri } from '../lib/messageAssets';

const PAGE_SIZE = 100;
const TIMESTAMP_GAP_MS = 60 * 60 * 1000;

const CHAT_THEMES = {
  sunset: {
    label: 'Original Orange',
    shell: 'bg-[#240202]',
    header: 'bg-[#240202]',
    body: 'bg-[linear-gradient(180deg,#4c0303_0%,#330202_38%,#210101_100%)]',
    composer: 'bg-[#3a1f1d]/88',
  },
  classic: {
    label: 'Direct Classic',
    shell: 'bg-[#0b0e13]',
    header: 'bg-[#0b0e13]',
    body: 'bg-[linear-gradient(180deg,#171b23_0%,#0d1016_38%,#07080b_100%)]',
    composer: 'bg-[#171b23]/92',
  },
  ocean: {
    label: 'Cobalt',
    shell: 'bg-[#09111f]',
    header: 'bg-[#09111f]',
    body: 'bg-[linear-gradient(180deg,#12345a_0%,#0b2340_36%,#07111f_100%)]',
    composer: 'bg-[#11243a]/92',
  },
  monochrome: {
    label: 'Monochrome',
    shell: 'bg-[#0a0a0a]',
    header: 'bg-[#0a0a0a]',
    body: 'bg-[linear-gradient(180deg,#1d1d1d_0%,#101010_38%,#070707_100%)]',
    composer: 'bg-[#1a1a1a]/92',
  },
  aurora: {
    label: 'Love',
    shell: 'bg-[#0b0820]',
    header: 'bg-[#0b0820]',
    body: 'bg-[linear-gradient(180deg,#4b1458_0%,#2a0c37_40%,#14071c_100%)]',
    composer: 'bg-[#31153d]/92',
  },
};

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return window.localStorage.getItem(key) || fallback;
}

function readFavouriteMap() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem('chat-favourites') || '{}');
  } catch {
    return {};
  }
}

function writeFavouriteMap(favouriteMap) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('chat-favourites', JSON.stringify(favouriteMap));
  }
}

function formatBubbleTimestamp(timestampMs) {
  return new Date(timestampMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDividerTimestamp(timestampMs) {
  const messageDate = new Date(timestampMs);
  const today = new Date();

  if (messageDate.toDateString() === today.toDateString()) {
    return `Today ${messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  return messageDate.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function groupMessages(messages) {
  return messages.reduce((groups, message, index) => {
    const previousMessage = messages[index - 1];
    const showDivider =
      index === 0 ||
      message.timestamp_ms - previousMessage.timestamp_ms >= TIMESTAMP_GAP_MS;

    const previousGroup = groups[groups.length - 1];
    if (previousGroup && previousGroup.senderName === message.sender_name && !showDivider) {
      previousGroup.messages.push(message);
      return groups;
    }

    groups.push({
      senderName: message.sender_name,
      showDivider,
      dividerLabel: formatDividerTimestamp(message.timestamp_ms),
      messages: [message],
    });

    return groups;
  }, []);
}

function getSwipeClientX(event) {
  if ('touches' in event) {
    return event.touches[0]?.clientX ?? null;
  }

  return event.clientX ?? null;
}

// The chat page owns message paging, overlays, and perspective swapping for a single thread.
const ChatPage = ({ conversation, ownerName, onBackToInbox }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('REELS');
  const [perspective, setPerspective] = useState(() => readStoredValue('chat-perspective', 'owner'));
  const [theme, setTheme] = useState(() => readStoredValue('chat-theme', 'sunset'));
  const [messages, setMessages] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revealProgress, setRevealProgress] = useState(0);
  const [viewerImage, setViewerImage] = useState('');
  const [favouriteMap, setFavouriteMap] = useState(() => readFavouriteMap());
  const [focusState, setFocusState] = useState(null);
  const [showLatestButton, setShowLatestButton] = useState(false);

  const scrollRef = useRef(null);
  const anchorRestoreRef = useRef(null);
  const didScrollToBottomRef = useRef(false);
  const dragStartRef = useRef(null);
  const themeMenuRef = useRef(null);
  const focusMessageIdRef = useRef(null);

  const themeClasses = CHAT_THEMES[theme] || CHAT_THEMES.sunset;
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);
  const conversationImage = resolveArchiveUri(conversation?.imageUri || '');
  const favouritesForConversation = useMemo(() => {
    return Object.values(favouriteMap[conversation?.threadId] || {}).sort(
      (a, b) => b.timestamp_ms - a.timestamp_ms,
    );
  }, [conversation?.threadId, favouriteMap]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadLatestConversation() {
      if (!conversation?.threadId) {
        return;
      }

      setIsInitialLoading(true);
      setLoadError('');
      setMessages([]);
      setHasMoreMessages(true);
      setFocusState(null);
      didScrollToBottomRef.current = false;

      try {
        const messagePage = await getConversationMessagePage(conversation.threadId, null, PAGE_SIZE);

        if (!isActive) {
          return;
        }

        setMessages(messagePage);
        setHasMoreMessages(messagePage.length === PAGE_SIZE);
      } catch {
        if (isActive) {
          setLoadError('Could not load this conversation right now.');
        }
      } finally {
        if (isActive) {
          setIsInitialLoading(false);
        }
      }
    }

    loadLatestConversation();

    return () => {
      isActive = false;
    };
  }, [conversation?.threadId]);

  useEffect(() => {
    if (!scrollRef.current || didScrollToBottomRef.current || messages.length === 0) {
      return;
    }

    if (focusMessageIdRef.current) {
      const focusNode = scrollRef.current.querySelector(`[data-message-id="${focusMessageIdRef.current}"]`);
      if (focusNode) {
        scrollRef.current.scrollTop = Math.max(0, focusNode.offsetTop - scrollRef.current.clientHeight / 2 + focusNode.clientHeight);
        focusMessageIdRef.current = null;
        didScrollToBottomRef.current = true;
        return;
      }
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    didScrollToBottomRef.current = true;
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current || !anchorRestoreRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      if (!scrollRef.current || !anchorRestoreRef.current) {
        return;
      }

      const { messageId, offset } = anchorRestoreRef.current;
      const anchorElement = scrollRef.current.querySelector(`[data-message-id="${messageId}"]`);

      if (anchorElement) {
        scrollRef.current.scrollTop = anchorElement.offsetTop - offset;
      }

      anchorRestoreRef.current = null;
    });
  }, [messages]);

  async function loadOlderMessages() {
    if (!conversation?.threadId || isInitialLoading || isLoadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    if (!oldestMessage || !scrollRef.current) {
      return;
    }

    const candidates = Array.from(scrollRef.current.querySelectorAll('[data-message-id]'));
    const firstVisible = candidates.find((node) => node.offsetTop + node.offsetHeight >= scrollRef.current.scrollTop);

    if (firstVisible) {
      anchorRestoreRef.current = {
        messageId: firstVisible.getAttribute('data-message-id'),
        offset: firstVisible.offsetTop - scrollRef.current.scrollTop,
      };
    }

    setIsLoadingMore(true);

    try {
      const nextPage = focusState
        ? await getConversationMessagePage(conversation.threadId, oldestMessage.timestamp_ms, 50)
        : await getConversationMessagePage(conversation.threadId, oldestMessage.timestamp_ms, PAGE_SIZE);

      setMessages((currentMessages) => [...nextPage, ...currentMessages]);
      setHasMoreMessages(nextPage.length === (focusState ? 50 : PAGE_SIZE));
      if (focusState) {
        setFocusState((current) => ({
          ...current,
          hasOlder: nextPage.length === 50,
        }));
      }
    } catch {
      anchorRestoreRef.current = null;
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function loadNewerMessages() {
    if (!conversation?.threadId || isInitialLoading || isLoadingMore || !focusState || messages.length === 0) {
      return;
    }

    const newestMessage = messages[messages.length - 1];
    if (!newestMessage || !scrollRef.current || !focusState.hasNewer) {
      return;
    }

    const candidates = Array.from(scrollRef.current.querySelectorAll('[data-message-id]'));
    const lastVisible = [...candidates].reverse().find((node) => node.offsetTop <= scrollRef.current.scrollTop + scrollRef.current.clientHeight);

    if (lastVisible) {
      anchorRestoreRef.current = {
        messageId: lastVisible.getAttribute('data-message-id'),
        offset: lastVisible.offsetTop - scrollRef.current.scrollTop,
      };
    }

    setIsLoadingMore(true);

    try {
      const nextPage = await getMessagesNewerThan(conversation.threadId, newestMessage.timestamp_ms, 50);
      setMessages((currentMessages) => [...currentMessages, ...nextPage]);
      setFocusState((current) => ({
        ...current,
        hasNewer: nextPage.length === 50,
      }));
    } catch {
      anchorRestoreRef.current = null;
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleScroll(event) {
    const element = event.currentTarget;
    const distanceFromLatest = element.scrollHeight - (element.scrollTop + element.clientHeight);
    setShowLatestButton(distanceFromLatest > 240);

    if (element.scrollTop < 160) {
      loadOlderMessages();
    }

    if (focusState && element.scrollTop + element.clientHeight >= element.scrollHeight - 160) {
      loadNewerMessages();
    }
  }

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
    setShowThemeMenu(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chat-theme', nextTheme);
    }
  }

  function handlePerspectiveChange(nextPerspective) {
    setPerspective(nextPerspective);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chat-perspective', nextPerspective);
    }
  }

  function togglePerspectiveQuickly() {
    handlePerspectiveChange(perspective === 'owner' ? 'other' : 'owner');
  }

  function handlePointerDown(event) {
    dragStartRef.current = getSwipeClientX(event);
  }

  function handlePointerMove(event) {
    if (dragStartRef.current == null) {
      return;
    }

    const currentX = getSwipeClientX(event);
    if (currentX == null) {
      return;
    }

    const delta = Math.max(0, dragStartRef.current - currentX);
    setRevealProgress(Math.min(delta / 56, 1));
  }

  function handlePointerEnd() {
    dragStartRef.current = null;
    setRevealProgress(0);
  }

  function toggleFavourite(message) {
    const threadId = conversation.threadId;
    const currentThreadFavourites = favouriteMap[threadId] || {};
    const nextThreadFavourites = { ...currentThreadFavourites };

    if (nextThreadFavourites[message.message_id]) {
      delete nextThreadFavourites[message.message_id];
    } else {
      nextThreadFavourites[message.message_id] = {
        message_id: message.message_id,
        sender_name: message.sender_name,
        timestamp_ms: message.timestamp_ms,
        text_content: message.text_content,
        preview_text: message.preview_text,
        thread_id: threadId,
      };
    }

    const nextFavouriteMap = {
      ...favouriteMap,
      [threadId]: nextThreadFavourites,
    };

    setFavouriteMap(nextFavouriteMap);
    writeFavouriteMap(nextFavouriteMap);
  }

  async function jumpToMessage(message) {
    setShowFavourites(false);

    const target = scrollRef.current?.querySelector(`[data-message-id="${message.message_id}"]`);
    if (target && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: Math.max(0, target.offsetTop - 120),
        behavior: 'smooth',
      });
      return;
    }

    setLoadError('');
    setIsInitialLoading(true);
    focusMessageIdRef.current = message.message_id;

    try {
      const context = await getMessageContext(conversation.threadId, message.timestamp_ms, 50, 50);
      setMessages(context.messages);
      setHasMoreMessages(context.hasOlder);
      setFocusState({
        focusMessageId: message.message_id,
        hasOlder: context.hasOlder,
        hasNewer: context.hasNewer,
      });
      didScrollToBottomRef.current = false;
    } catch {
      setLoadError('Could not load that favourite right now.');
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function scrollToLatest() {
    if (!conversation?.threadId) {
      return;
    }

    setIsInitialLoading(true);
    setLoadError('');
    setFocusState(null);
    setHasMoreMessages(true);
    didScrollToBottomRef.current = false;

    try {
      const latestPage = await getConversationMessagePage(conversation.threadId, null, PAGE_SIZE);
      setMessages(latestPage);
      setHasMoreMessages(latestPage.length === PAGE_SIZE);
      setShowLatestButton(false);
    } catch {
      setLoadError('Could not return to the latest messages right now.');
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function handleSearchResultSelect(result) {
    setShowSearch(false);
    setLoadError('');
    setIsInitialLoading(true);
    focusMessageIdRef.current = result.message_id;

    try {
      const context = await getMessageContext(conversation.threadId, result.timestamp_ms, 50, 50);
      setMessages(context.messages);
      setHasMoreMessages(context.hasOlder);
      setFocusState({
        focusMessageId: result.message_id,
        hasOlder: context.hasOlder,
        hasNewer: context.hasNewer,
      });
      didScrollToBottomRef.current = false;
    } catch {
      setLoadError('Could not load that search result right now.');
    } finally {
      setIsInitialLoading(false);
    }
  }

  if (!conversation) {
    return <div className="flex h-full w-full bg-[#0b0e13]" />;
  }

  const isOwnerPerspective = perspective === 'owner';
  const recipient = {
    name: conversation.displayName,
    handle: conversation.username || '',
    pfp: conversationImage || null,
  };
  const perspectiveIconLabel = isOwnerPerspective ? 'Swap perspective' : 'Return to normal';
  const currentFavouriteIds = favouriteMap[conversation.threadId] || {};
  const controlButtonClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-white/82 shadow-none outline-none transition hover:bg-white/5 focus:outline-none md:h-11 md:w-11';

  return (
    <div className={`relative flex h-full w-full flex-col ${themeClasses.shell}`}>
      <header
        className={`flex items-center justify-between px-4 py-4 md:px-6 ${themeClasses.header}`}
        onClick={() => setShowInfo(true)}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full p-1 text-white md:hidden"
            onClick={(event) => {
              event.stopPropagation();
              onBackToInbox?.();
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <img
            src={recipient.pfp}
            alt={recipient.name}
            className="h-11 w-11 rounded-full object-cover"
          />

          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[15px] font-semibold leading-tight md:text-[18px]">
              {recipient.name}
              <ChevronRight className="h-3 w-3 opacity-40" />
            </span>
            <span className="text-[12px] text-white/70">
              {recipient.handle ? `@${recipient.handle}` : `${conversation.messageCount} messages`}
            </span>
          </div>
        </div>

        <div className="pr-1 text-white/70" />
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerEnd}
        onTouchCancel={handlePointerEnd}
        className={`app-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-6 ${themeClasses.body}`}
      >
        {isLoadingMore && (
          <div className="mb-4 flex items-center justify-center">
            <LoaderCircle className="h-5 w-5 animate-spin text-white/70" />
          </div>
        )}

        {isInitialLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            Loading conversation...
          </div>
        ) : loadError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-200">{loadError}</div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            This conversation has no readable messages yet.
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={`${group.senderName}-${groupIndex}`} className="mb-5">
              {group.showDivider && (
                <div className="mb-5 mt-2 text-center text-[12px] font-medium text-white/80 md:text-[13px]">
                  {group.dividerLabel}
                </div>
              )}

              {group.messages.map((message, messageIndex) => {
                const isSender = isOwnerPerspective
                  ? message.sender_name === ownerName
                  : message.sender_name !== ownerName;
                const isLastInGroup = messageIndex === group.messages.length - 1;

                return (
                  <MessageBubble
                    key={message.message_id}
                    message={message}
                    isSender={isSender}
                    showAvatar={!isSender && isLastInGroup}
                    pfp={conversationImage || null}
                    timestamp={formatBubbleTimestamp(message.timestamp_ms)}
                    showTimestamp
                    revealProgress={revealProgress}
                    onOpenMedia={setViewerImage}
                    isFavourite={Boolean(currentFavouriteIds[message.message_id])}
                    onToggleFavourite={toggleFavourite}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {showLatestButton && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <button
            type="button"
            onClick={scrollToLatest}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/18 bg-[#12151d] px-4 py-2 text-sm text-white shadow-[0_14px_32px_rgba(0,0,0,0.22)]"
          >
            <ChevronsDown className="h-4 w-4" />
            <span>Back to latest chat</span>
          </button>
        </div>
      )}

      <div className="px-3 pb-3 pt-2 md:px-6 md:pb-5 md:pt-3">
        <div className={`flex items-center gap-1.5 rounded-[30px] px-2 py-2 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:gap-2 md:px-3 md:py-3 ${themeClasses.composer}`}>
          <div className="flex min-w-0 flex-[1_1_auto] items-center gap-2 rounded-full border border-white/10 bg-black/5 px-3 py-2.5 text-white/60 md:gap-3 md:px-4 md:py-3">
            <Search className="h-5 w-5 shrink-0" />
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="w-full border-0 bg-transparent p-0 text-left text-[15px] text-white/72 shadow-none outline-none hover:border-transparent focus:outline-none md:text-[16px]"
            >
              Search in conversation
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFavourites(true)}
            className={controlButtonClass}
            aria-label="Favourites"
          >
            <Heart className={`h-5 w-5 md:h-6 md:w-6 ${favouritesForConversation.length > 0 ? 'fill-[#ff5a7a] text-[#ff5a7a]' : ''}`} />
          </button>

          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setShowThemeMenu((current) => !current)}
              className={controlButtonClass}
              aria-label="Theme swap"
            >
              <Palette className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {showThemeMenu && (
              <div className="app-scrollbar absolute bottom-12 right-0 z-20 flex w-[min(84vw,280px)] flex-col gap-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-[#11151c]/95 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                {Object.entries(CHAT_THEMES).map(([id, config]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleThemeChange(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${theme === id ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/6'}`}
                  >
                    <span className={`h-6 w-6 rounded-full ${config.header}`} />
                    <span className="truncate whitespace-nowrap">{config.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={togglePerspectiveQuickly}
            className={controlButtonClass}
            aria-label={perspectiveIconLabel}
            title={perspectiveIconLabel}
          >
            {isOwnerPerspective ? (
              <UserRound className="h-5 w-5 md:h-6 md:w-6" />
            ) : (
              <ArrowLeftRight className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </button>
        </div>
      </div>

      <SettingsOverlay
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        recipient={recipient}
        ownerName={ownerName || 'You'}
        perspective={perspective}
        setPerspective={handlePerspectiveChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={handleThemeChange}
        themes={Object.entries(CHAT_THEMES).map(([id, config]) => ({
          id,
          label: config.label,
        }))}
        threadId={conversation.threadId}
      />
      <FavouritesOverlay
        isOpen={showFavourites}
        onClose={() => setShowFavourites(false)}
        favourites={favouritesForConversation}
        onSelectMessage={jumpToMessage}
      />
      <MediaViewer
        key={viewerImage || 'media-viewer'}
        isOpen={Boolean(viewerImage)}
        src={viewerImage}
        alt={conversation.displayName}
        onClose={() => setViewerImage('')}
      />
      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        participants={[ownerName, ...((conversation.participants || []).filter((name) => name !== ownerName))].filter(Boolean)}
        threadId={conversation.threadId}
        onSelectResult={handleSearchResultSelect}
      />
    </div>
  );
};

export default ChatPage;
