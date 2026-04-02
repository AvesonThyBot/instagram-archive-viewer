function isReactionNotification(content) {
  if (typeof content !== 'string') {
    return false;
  }

  const trimmed = content.trim();
  return /^Reacted\s.+\sto your message\s*$/i.test(trimmed);
}

function getMessageAssetEntries(message) {
  const entries = [];

  if (Array.isArray(message.photos)) {
    message.photos.forEach((photo) => {
      if (photo?.uri) {
        entries.push({
          kind: 'photo',
          uri: photo.uri,
          createdAt: photo.creation_timestamp || null,
        });
      }
    });
  }

  if (Array.isArray(message.videos)) {
    message.videos.forEach((video) => {
      if (video?.uri) {
        entries.push({
          kind: 'video',
          uri: video.uri,
          createdAt: video.creation_timestamp || null,
        });
      }
    });
  }

  if (Array.isArray(message.audio_files)) {
    message.audio_files.forEach((audioFile) => {
      if (audioFile?.uri) {
        entries.push({
          kind: 'audio',
          uri: audioFile.uri,
          createdAt: audioFile.creation_timestamp || null,
        });
      }
    });
  }

  if (Array.isArray(message.files)) {
    message.files.forEach((file) => {
      if (file?.uri) {
        entries.push({
          kind: 'file',
          uri: file.uri,
          name: file.name || '',
          createdAt: file.creation_timestamp || null,
        });
      }
    });
  }

  return entries;
}

function getShareType(message) {
  const shareLink = message?.share?.link || '';

  if (!shareLink) {
    return '';
  }

  if (shareLink.includes('/reel/') || shareLink.includes('instagram.com/reel')) {
    return 'reel';
  }

  if (shareLink.includes('giphy.com') || shareLink.includes('/media/')) {
    return 'gif';
  }

  return 'link';
}

function formatMessagePreview(message) {
  const normalized = normalizeMessage(message);
  return normalized?.previewText || 'No messages yet';
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const content = typeof message.content === 'string' ? message.content.trim() : '';
  const hasMeaningfulContent = Boolean(content) && !isReactionNotification(content);
  const assets = getMessageAssetEntries(message);
  const shareType = getShareType(message);
  const shareLink = message?.share?.link || '';
  const reactionCount = Array.isArray(message.reactions) ? message.reactions.length : 0;
  const callDuration = typeof message.call_duration === 'number' ? message.call_duration : null;

  if (!hasMeaningfulContent && assets.length === 0 && !shareLink && callDuration === null) {
    return null;
  }

  let type = 'text';
  let category = 'message';
  let previewText = content || 'Sent a message';
  let textContent = hasMeaningfulContent ? content : '';
  let assetUri = assets[0]?.uri || '';
  let assetKind = assets[0]?.kind || '';

  if (assets.length > 0) {
    type = assets[0].kind;
    category = 'attachment';

    if (!previewText || !hasMeaningfulContent) {
      const previews = {
        photo: 'Sent a photo',
        video: 'Sent a video',
        audio: 'Sent an audio message',
        file: 'Sent a file',
      };
      previewText = previews[assets[0].kind] || 'Sent an attachment';
    }
  } else if (shareLink) {
    type = shareType || 'link';
    category = shareType === 'reel' ? 'reel' : 'link';
    assetUri = shareLink;
    assetKind = type;
    previewText = textContent || (shareType === 'reel' ? 'Shared a reel' : shareType === 'gif' ? 'Shared a GIF' : 'Shared a link');
  } else if (callDuration !== null) {
    type = 'call';
    category = 'event';
    previewText = textContent || 'Call event';
  }

  return {
    senderName: message.sender_name || '',
    timestampMs: typeof message.timestamp_ms === 'number' ? message.timestamp_ms : 0,
    type,
    category,
    textContent,
    previewText,
    assetUri,
    assetKind,
    shareLink,
    callDuration,
    reactionCount,
    attachments: assets,
    raw: message,
  };
}

function resolveConversationImageUri(threadData) {
  return threadData?.image?.uri || '/assets/default.jpg';
}

export {
  formatMessagePreview,
  isReactionNotification,
  normalizeMessage,
  resolveConversationImageUri,
};
