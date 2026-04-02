import { useEffect, useRef, useState } from 'react';
import { FileText, Heart, Link as LinkIcon, Pause, Play, PlayCircle, Radio, Video } from 'lucide-react';
import { getMessagePrimaryAsset, resolveArchiveUri } from '../lib/messageAssets';

// Media tiles fade in from a placeholder so long chats do not flash or shift while scrolling.
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
        className="block w-full appearance-none border-0 bg-transparent p-0 shadow-none outline-none hover:border-transparent focus:outline-none"
      >
        <LazyMediaImage
          src={assetUrl}
          alt=""
          className="max-h-[34svh] w-full rounded-[22px] md:max-h-[48vh] lg:max-h-[54vh]"
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

  if (message.type === 'audio' && assetUrl) {
    return <AudioAttachment assetUrl={assetUrl} label={message.text_content || message.preview_text} />;
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
      className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
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

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return '0:00';
  }

  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function AudioAttachment({ assetUrl, label }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    function handleLoadedMetadata() {
      setDuration(audio.duration || 0);
    }

    function handleTimeUpdate() {
      setCurrentTime(audio.currentTime || 0);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [assetUrl]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) * 100 : 0;

  return (
    <div className="w-full rounded-[24px] border border-white/10 bg-[#2b1516]/85 px-4 py-3 text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
      <audio ref={audioRef} preload="metadata" src={assetUrl} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#4a2224] text-white"
          aria-label={isPlaying ? 'Pause audio message' : 'Play audio message'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#d5b9ff]">
            {label || 'Audio message'}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#a78bfa] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/60">
            <span>audio</span>
            <span>{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
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
              className={`absolute ${isSender ? '-left-8 md:-left-9' : '-right-8 md:-right-9'} top-1/2 -translate-y-1/2 appearance-none border-0 bg-transparent p-0 text-white shadow-none outline-none hover:border-transparent focus:outline-none`}
              aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
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
