import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatPage from './chat';

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

function getConversationImage(conversation) {
  if (conversation.imageUri) {
    return `/data/${conversation.imageUri}`;
  }

  return '';
}

const InboxPage = () => {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const [indexData, setIndexData] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
    }));
  }, [indexData, ownerName]);

  useEffect(() => {
    if (!indexData || !threadId) {
      setSelectedMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    const selectedConversation = conversations.find((conversation) => conversation.threadId === threadId);
    if (!selectedConversation) {
      setSelectedMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let isActive = true;
    setIsLoadingMessages(true);

    fetch(`/data/${selectedConversation.threadPath}/messages.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load conversation');
        }

        return response.json();
      })
      .then((data) => {
        if (!isActive) {
          return;
        }

        const orderedMessages = Array.isArray(data.messages)
          ? [...data.messages]
              .filter((message) => typeof message?.timestamp_ms === 'number')
              .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
          : [];

        setSelectedMessages(orderedMessages);
      })
      .catch(() => {
        if (isActive) {
          setSelectedMessages([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [conversations, indexData, threadId]);

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
      <aside
        className={`${
          showMobileChat ? 'hidden md:flex' : 'flex'
        } w-full max-w-[380px] flex-col border-r border-white/10 bg-[#0f1218] md:w-[360px]`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500 md:block hidden">Messages</p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight">{ownerName || 'Inbox'}</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 md:hidden">
            <PanelLeft className="h-4 w-4" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {actionButtons.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {filteredConversations.map((conversation) => {
            const isSelected = conversation.threadId === threadId;

            return (
              <button
                key={conversation.threadId}
                type="button"
                onClick={() => {
                  navigate(`/chat/${conversation.threadId}`);
                }}
                className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
              >
                {getConversationImage(conversation) ? (
                  <img
                    src={getConversationImage(conversation)}
                    alt={conversation.displayName}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5851db] via-[#c13584] to-[#f77737] text-sm font-semibold">
                    {conversation.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}

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
            <div className="px-4 py-10 text-sm text-zinc-500">
              No conversations matched that search.
            </div>
          )}
        </div>
      </aside>

      <main className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-[#0b0e13]`}>
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading conversation...
          </div>
        ) : selectedConversation ? (
          <ChatPage
            key={selectedConversation.threadId}
            conversation={selectedConversation}
            ownerName={ownerName}
            messages={selectedMessages}
            onBackToInbox={() => navigate('/')}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(88,81,219,0.14),_transparent_30%),linear-gradient(180deg,#0b0e13_0%,#090b10_100%)]" />
        )}
      </main>
    </div>
  );
};

export default InboxPage;
