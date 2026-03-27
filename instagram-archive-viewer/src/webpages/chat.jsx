import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Menu, Mic, Phone, Video } from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import SettingsOverlay from '../components/SettingsOverlay';

const CHAT_THEMES = {
  sunset: {
    label: 'Original Orange',
    shell: 'bg-[#0b0e13]',
    header: 'bg-[#0f1218]',
    body: 'bg-[linear-gradient(180deg,#280000_0%,#110000_34%,#060606_100%)]',
  },
  classic: {
    label: 'Direct Classic',
    shell: 'bg-[#0b0e13]',
    header: 'bg-[#0f1218]',
    body: 'bg-[linear-gradient(180deg,#141414_0%,#0d0d0f_42%,#060606_100%)]',
  },
  ocean: {
    label: 'Cobalt',
    shell: 'bg-[#09111f]',
    header: 'bg-[#0c1728]',
    body: 'bg-[linear-gradient(180deg,#0a2540_0%,#0d3b66_38%,#07111f_100%)]',
  },
  monochrome: {
    label: 'Monochrome',
    shell: 'bg-[#0a0a0a]',
    header: 'bg-[#111111]',
    body: 'bg-[linear-gradient(180deg,#1b1b1b_0%,#0f0f10_38%,#050505_100%)]',
  },
  aurora: {
    label: 'Love',
    shell: 'bg-[#0a1120]',
    header: 'bg-[#0d1528]',
    body: 'bg-[linear-gradient(180deg,#132238_0%,#194b4f_40%,#08111a_100%)]',
  },
};

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return window.localStorage.getItem(key) || fallback;
}

function formatChatTimestamp(timestampMs) {
  return new Date(timestampMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function createMessageContent(message) {
  if (typeof message.content === 'string' && message.content.trim()) {
    return message.content.trim();
  }

  if (Array.isArray(message.photos) && message.photos.length > 0) {
    return 'Sent a photo';
  }

  if (Array.isArray(message.videos) && message.videos.length > 0) {
    return 'Sent a video';
  }

  if (message.share?.link) {
    return message.share.share_text?.trim() || message.share.link;
  }

  if (Array.isArray(message.reactions) && message.reactions.length > 0) {
    return 'Reacted to a message';
  }

  return 'Sent a message';
}

function getConversationImage(conversation) {
  if (!conversation) {
    return '';
  }

  if (conversation.imageUri) {
    return `/data/${conversation.imageUri}`;
  }

  return '';
}

const ChatPage = ({ conversation, ownerName, messages, onOpenSidebar, onBackToInbox }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('REELS');
  const [imageFailed, setImageFailed] = useState(false);
  const [perspective, setPerspective] = useState(() => readStoredValue('chat-perspective', 'owner'));
  const [theme, setTheme] = useState(() => readStoredValue('chat-theme', 'sunset'));

  const themeClasses = CHAT_THEMES[theme] || CHAT_THEMES.sunset;

  const groupedMessages = useMemo(() => {
    return messages.reduce((groups, message) => {
      const senderId = message.sender_name;
      const content = createMessageContent(message);

      if (!content) {
        return groups;
      }

      const formattedMessage = {
        id: `${message.timestamp_ms}-${senderId}`,
        senderId,
        timestamp_ms: message.timestamp_ms,
        text: content,
      };

      const previousGroup = groups[groups.length - 1];
      if (previousGroup && previousGroup.senderId === senderId) {
        previousGroup.messages.push(formattedMessage);
      } else {
        groups.push({ senderId, messages: [formattedMessage] });
      }

      return groups;
    }, []);
  }, [messages]);

  if (!conversation) {
    return <div className="flex h-full w-full bg-[#0b0e13]" />;
  }

  const conversationImage = imageFailed ? '' : getConversationImage(conversation);
  const recipient = {
    name: conversation.displayName,
    handle: conversation.username || '',
    pfp: conversationImage || null,
  };

  const isOwnerPerspective = perspective === 'owner';

  return (
    <div className={`flex h-full w-full flex-col ${themeClasses.shell}`}>
      <header
        className={`flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6 ${themeClasses.header}`}
        onClick={() => setShowInfo(true)}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 md:hidden"
            onClick={(event) => {
              event.stopPropagation();
              onBackToInbox?.();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="hidden rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 md:hidden"
            onClick={(event) => {
              event.stopPropagation();
              onOpenSidebar?.();
            }}
          >
            <Menu className="h-4 w-4" />
          </button>

          {conversationImage ? (
            <img
              src={conversationImage}
              alt={conversation.displayName}
              className="h-10 w-10 rounded-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5851db] via-[#c13584] to-[#f77737] text-sm font-semibold">
              {conversation.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[15px] font-semibold leading-tight">
              {conversation.displayName}
              <ChevronRight className="h-3 w-3 opacity-40" />
            </span>
            <span className="text-[12px] text-zinc-500">
              {conversation.messageCount} messages
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-5 pr-1 text-zinc-300 md:flex">
          <Phone className="h-5 w-5" />
          <Video className="h-5 w-5" />
        </div>
      </header>

      <div className={`min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-6 ${themeClasses.body}`}>
        {groupedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            This conversation has no readable messages yet.
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={`${group.senderId}-${groupIndex}`} className="mb-5">
              {group.messages.map((message, messageIndex) => {
                const isSender = isOwnerPerspective
                  ? message.senderId === ownerName
                  : message.senderId !== ownerName;
                const isLastInGroup = messageIndex === group.messages.length - 1;

                return (
                  <div key={message.id}>
                    <MessageBubble
                      content={message.text}
                      isSender={isSender}
                      senderId={group.senderId}
                      showAvatar={!isSender && isLastInGroup}
                      pfp={conversationImage || null}
                    />
                    {isLastInGroup && (
                      <div
                        className={`mt-1 px-4 text-[11px] text-zinc-500 ${
                          isSender ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatChatTimestamp(message.timestamp_ms)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] px-4 py-3">
          <button type="button" className="rounded-full bg-[#0095f6] p-2 text-white">
            <ImageIcon className="h-4 w-4" />
          </button>
          <div className="flex-1 text-sm text-zinc-500">Message...</div>
          <Mic className="h-5 w-5 text-zinc-400" />
        </div>
      </div>

      <SettingsOverlay
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        recipient={recipient}
        perspective={perspective}
        setPerspective={(nextPerspective) => {
          setPerspective(nextPerspective);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('chat-perspective', nextPerspective);
          }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={(nextTheme) => {
          setTheme(nextTheme);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('chat-theme', nextTheme);
          }
        }}
        themes={Object.entries(CHAT_THEMES).map(([id, config]) => ({
          id,
          label: config.label,
        }))}
      />
    </div>
  );
};

export default ChatPage;
