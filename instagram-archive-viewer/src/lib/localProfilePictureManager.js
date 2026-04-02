const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// Uploads are proxied through the local dev server so the app can write into public/assets/upload
// without asking the user to manually pick project folders for every image.
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadProfilePicture({ threadId, displayName, file }) {
  const validationError = validateProfilePictureFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch('/api/profile-picture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      threadId,
      displayName: displayName || '',
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Could not save that profile picture.');
  }

  return payload;
}
