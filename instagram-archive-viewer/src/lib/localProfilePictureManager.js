const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// Local avatar uploads use the File System Access API so files can be written straight into public/assets.
function sanitizeBaseName(value) {
  return (value || 'profile')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'profile';
}

function getExtensionFromFile(file) {
  const mimeExtension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }[file.type];

  if (mimeExtension) {
    return mimeExtension;
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return fileExtension || 'png';
}

async function getFileHandle(parentHandle, name, options = {}) {
  return parentHandle.getFileHandle(name, options);
}

async function getDirectoryHandle(parentHandle, name, options = {}) {
  return parentHandle.getDirectoryHandle(name, options);
}

async function writeJsonFile(fileHandle, value) {
  const writer = await fileHandle.createWritable();
  await writer.write(JSON.stringify(value, null, 2));
  await writer.close();
}

async function writeBinaryFile(fileHandle, file) {
  const writer = await fileHandle.createWritable();
  await writer.write(await file.arrayBuffer());
  await writer.close();
}

async function resolveProjectFiles(projectRootHandle) {
  const appDirHandle = await getDirectoryHandle(projectRootHandle, 'instagram-archive-viewer');
  const publicDirHandle = await getDirectoryHandle(appDirHandle, 'public');
  const assetsDirHandle = await getDirectoryHandle(publicDirHandle, 'assets', { create: true });
  const dataDirHandle = await getDirectoryHandle(publicDirHandle, 'data');
  const activityDirHandle = await getDirectoryHandle(dataDirHandle, 'your_instagram_activity');
  const messagesDirHandle = await getDirectoryHandle(activityDirHandle, 'messages');
  const inboxIndexHandle = await getFileHandle(messagesDirHandle, 'inbox_index.json');

  return {
    assetsDirHandle,
    inboxIndexHandle,
  };
}

export function getMissingProfileConversations(indexData) {
  return (indexData?.conversations || []).filter((conversation) => {
    const imageUri = conversation.imageUri || '';
    return !conversation.isGroup && (!imageUri || imageUri === '/assets/default.jpg');
  });
}

export function validateProfilePictureFile(file) {
  if (!file) {
    return 'Choose an image file first.';
  }

  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return 'Use a JPG, PNG, WEBP, or GIF image.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Profile pictures must be 4MB or smaller.';
  }

  return '';
}

export async function persistProfilePicture({
  projectRootHandle,
  indexData,
  threadId,
  displayName,
  file,
}) {
  const validationError = validateProfilePictureFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const { assetsDirHandle, inboxIndexHandle } = await resolveProjectFiles(projectRootHandle);
  const nextIndexData = structuredClone(indexData);
  const targetConversation = nextIndexData.conversations?.find((conversation) => conversation.threadId === threadId);

  if (!targetConversation) {
    throw new Error('Could not find that conversation in the inbox index.');
  }

  const extension = getExtensionFromFile(file);
  const fileName = `${sanitizeBaseName(displayName)}-${threadId}.${extension}`;
  const imageHandle = await getFileHandle(assetsDirHandle, fileName, { create: true });

  await writeBinaryFile(imageHandle, file);

  targetConversation.imageUri = `/assets/${fileName}`;
  await writeJsonFile(inboxIndexHandle, nextIndexData);

  return {
    nextIndexData,
    imageUri: targetConversation.imageUri,
    fileName,
  };
}
