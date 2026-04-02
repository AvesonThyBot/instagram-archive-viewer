export function resolveArchiveUri(uri) {
  if (!uri) {
    return '';
  }

  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('/')) {
    return uri;
  }

  return `/data/${uri}`;
}

// Messages can expose assets either through normalized metadata or legacy flattened columns.
export function getMessagePrimaryAsset(message) {
  if (Array.isArray(message?.metadata?.attachments) && message.metadata.attachments.length > 0) {
    return message.metadata.attachments[0];
  }

  if (message?.asset_uri) {
    return {
      kind: message.asset_kind || message.type,
      uri: message.asset_uri,
    };
  }

  return null;
}
