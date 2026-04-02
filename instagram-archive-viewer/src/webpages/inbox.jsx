import React, { useEffect, useMemo, useState } from 'react';
import { Download, PanelLeft, Search, Settings, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatPage from './chat';
import { resolveArchiveUri } from '../lib/messageAssets';

const INDEX_URL = '/data/your_instagram_activity/messages/inbox_index.json';

const actionButtons = [
  { label: 'Settings', icon: Settings },
  { label: 'Wrapped', icon: Sparkles },
  { label: 'Export', icon: Download },
];

function formatMessagePreview(conversation, ownerName) {
  const preview = conversation.lastMessagePreview || 'No messages yet';
  if (!conversation.lastMessageSender || !ownerName) {
    return preview;
  }

  return conversation.lastMessageSender === ownerName ? `You: ${preview}` : preview;
}

function formatInboxTimestamp(timestampMs) {
  if (!timestampMs) {
    return '';
  }

  const messageDate = new Date(timestampMs);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24 && now.getDate() === messageDate.getDate()) {
    return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  if (diffDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  }

  return messageDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function getConversationName(conversation, ownerName) {
  if (conversation.isGroup && conversation.title) {
    return conversation.title;
  }

  const otherParticipants = (conversation.participants || []).filter((name) => name !== ownerName);
  return conversation.title || otherParticipants[0] || conversation.participants?.[0] || conversation.threadId;
}

const InboxPage = () => {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const [indexData, setIndexData] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isCompactMobileInbox, setIsCompactMobileInbox] = useState(false);

  // The inbox list still comes from the lightweight JSON index so the shell loads immediately.
  useEffect(() => {
    let isActive = true;

    fetch(INDEX_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load inbox index');
        }

        return response.json();
      })
      .then((data) => {
        if (isActive) {
          setIndexData(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setIndexData({ ownerName: '', conversations: [] });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const ownerName = indexData?.ownerName || '';
  const conversations = useMemo(() => {
    return (indexData?.conversations || []).map((conversation) => ({
      ...conversation,
      username: !conversation.isGroup ? conversation.threadId.replace(/_\d+$/, '') : '',
      displayName: getConversationName(conversation, ownerName),
      resolvedImageUri: resolveArchiveUri(conversation.imageUri),
    }));
  }, [indexData, ownerName]);

  const filteredConversations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const displayName = conversation.displayName.toLowerCase();
      const preview = (conversation.lastMessagePreview || '').toLowerCase();
      return displayName.includes(query) || preview.includes(query);
    });
  }, [conversations, searchValue]);

  const selectedConversation = conversations.find((conversation) => conversation.threadId === threadId);
  const showMobileChat = Boolean(selectedConversation);

  return (
    <div className="flex h-full w-full bg-[#0a0d12] text-white">
      {/* Inbox column / hidden on phones once a thread is opened */}
      <aside
        className={`${
          showMobileChat ? 'hidden md:flex' : 'flex'
        } w-full max-w-[380px] flex-col border-r border-white/10 bg-[#0f1218] md:w-[360px]`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <p className="hidden text-[11px] uppercase tracking-[0.28em] text-zinc-500 md:block">Messages</p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight">{ownerName || 'Inbox'}</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCompactMobileInbox((current) => !current)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 md:hidden"
            aria-label="Toggle inbox controls"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        <div className={`${isCompactMobileInbox ? 'hidden md:grid' : 'grid'} grid-cols-3 gap-2 px-4 pb-4`}>
          {actionButtons.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              {React.createElement(icon, { className: 'h-4 w-4' })}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className={`${isCompactMobileInbox ? 'hidden md:block' : 'block'} px-4 pb-4`}>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-zinc-400">
            <Search className="h-4 w-4" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>

        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {filteredConversations.map((conversation) => {
            const isSelected = conversation.threadId === threadId;

            return (
              <button
                key={conversation.threadId}
                type="button"
                onClick={() => navigate(`/chat/${conversation.threadId}`)}
                className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <img
                  src={conversation.resolvedImageUri}
                  alt={conversation.displayName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[15px] font-medium text-white">{conversation.displayName}</p>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {formatInboxTimestamp(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-zinc-400">
                    {formatMessagePreview(conversation, ownerName)}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="px-4 py-10 text-sm text-zinc-500">No conversations matched that search.</div>
          )}
        </div>
      </aside>

      {/* Main chat panel / only shown once a thread is picked on mobile */}
      <main className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-[#0b0e13]`}>
        {selectedConversation ? (
          <ChatPage key={selectedConversation.threadId} conversation={selectedConversation} ownerName={ownerName} onBackToInbox={() => navigate('/')} />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(88,81,219,0.14),_transparent_30%),linear-gradient(180deg,#0b0e13_0%,#090b10_100%)]" />
        )}
      </main>
    </div>
  );
};

export default InboxPage;
