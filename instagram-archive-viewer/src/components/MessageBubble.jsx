import { useState } from 'react';
import { FileText, Heart, Link as LinkIcon, PlayCircle, Radio, Video } from 'lucide-react';
import { getMessagePrimaryAsset, resolveArchiveUri } from '../lib/messageAssets';

function LazyMediaImage({ src, alt, className, imageClassName = '' }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-white/8 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-700/60" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width="960"
        height="1280"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imageClassName}`}
      />
    </div>
  );
}

function AttachmentCard({ message, onOpenMedia }) {
  const asset = getMessagePrimaryAsset(message);
  const assetUrl = resolveArchiveUri(asset?.uri || message.asset_uri || message.share_link);

  if (message.type === 'photo' && assetUrl) {
    return (
      <button
        type="button"
        onClick={() => onOpenMedia?.(assetUrl)}
        className="w-full border-0 bg-transparent p-0 shadow-none hover:border-transparent"
      >
        <LazyMediaImage
          src={assetUrl}
          alt=""
          className="max-h-[44svh] w-full rounded-[22px] md:max-h-[52vh] lg:max-h-[58vh]"
          imageClassName="object-contain bg-black/20"
        />
      </button>
    );
  }

  if (message.type === 'video' && assetUrl) {
    return (
      <div className="overflow-hidden rounded-[22px]">
        <video controls preload="metadata" className="max-h-[44svh] w-full bg-black/35 object-contain md:max-h-[52vh] lg:max-h-[58vh]">
          <source src={assetUrl} />
        </video>
      </div>
    );
  }

  const typeIcon = {
    audio: Radio,
    file: FileText,
    reel: PlayCircle,
    link: LinkIcon,
    gif: Video,
  }[message.type] || LinkIcon;

  const Icon = typeIcon;
  const href = assetUrl || message.share_link;
  const label = message.text_content || message.preview_text;

  return (
    <a
      href={href || '#'}
      target={href ? '_blank' : undefined}
      rel={href ? 'noreferrer' : undefined}
      className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white"
    >
      <div className="rounded-full bg-white/10 p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{label}</p>
        <p className="truncate text-xs text-zinc-400">
          {message.type === 'reel' ? 'Instagram reel' : message.type}
        </p>
      </div>
    </a>
  );
}

const MessageBubble = ({
  message,
  isSender,
  showAvatar,
  pfp,
  timestamp,
  showTimestamp,
  revealProgress,
  onOpenMedia,
  isFavourite,
  onToggleFavourite,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const bubbleColor = isSender ? 'bg-[#ff5a00]' : 'bg-[#740808]';
  const hasText = Boolean(message.text_content);
  const isAttachmentOnly = !hasText && message.type !== 'text';

  return (
    <div
      className="relative"
      data-message-id={message.message_id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-white/65 transition-opacity duration-150"
        style={{ opacity: showTimestamp ? revealProgress : 0 }}
      >
        {showTimestamp ? timestamp : ''}
      </div>

      <div
        className={`mb-[3px] flex w-full items-center gap-2 px-2 transition-transform duration-150 ${
          isSender ? 'justify-end' : 'justify-start'
        }`}
        style={{ transform: `translateX(${-revealProgress * 52}px)` }}
      >
        {!isSender && (
          <div className="h-8 w-8 flex-shrink-0 self-end">
            {showAvatar ? (
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[#ffffff14] bg-zinc-800">
                {pfp ? (
                  <img
                    src={pfp}
                    className="h-full w-full object-cover"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="64"
                    height="64"
                  />
                ) : (
                  <div className="text-[8px] text-zinc-500">PFP</div>
                )}
              </div>
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        <div className="relative flex max-w-[82%] flex-col gap-2 md:max-w-[68%] lg:max-w-[58%]">
          {!isAttachmentOnly && (
            <div className={`rounded-[24px] px-5 py-3 text-[15px] leading-[1.34] text-white shadow-[0_8px_30px_rgba(0,0,0,0.14)] ${bubbleColor} ${isFavourite ? 'ring-2 ring-[#ff7a93]/80 ring-offset-2 ring-offset-transparent' : ''}`}>
              {message.text_content || message.preview_text}
            </div>
          )}

          {message.type !== 'text' && <AttachmentCard message={message} onOpenMedia={onOpenMedia} />}

          {(isHovered || isFavourite) && (
            <button
              type="button"
              onClick={() => onToggleFavourite?.(message)}
              className={`absolute ${isSender ? '-left-9' : '-right-9'} top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-white shadow-none hover:border-transparent`}
            >
              <Heart className={`h-4 w-4 ${isFavourite ? 'fill-[#ff5a7a] text-[#ff5a7a]' : 'text-white/80'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
