import { useMemo, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle } from 'lucide-react';
import ActionPanelOverlay from './ActionPanelOverlay';
import {
  getMissingProfileConversations,
  uploadProfilePicture,
} from '../lib/localProfilePictureManager';

// The settings panel doubles as a manual avatar manager for direct messages that lack exported pfps.
const InboxSettingsOverlay = ({ isOpen, onClose, indexData, onIndexUpdate }) => {
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingThreadId, setUploadingThreadId] = useState('');
  const inputRefs = useRef({});

  // Direct messages without exported pfps are grouped here so the user can fill them in manually.
  const missingConversations = useMemo(
    () => getMissingProfileConversations(indexData),
    [indexData],
  );

  async function handleUpload(conversation, event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingThreadId(conversation.threadId);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const { nextIndexData, fileName } = await uploadProfilePicture({
        threadId: conversation.threadId,
        displayName: conversation.displayName,
        file,
      });

      onIndexUpdate?.(nextIndexData);
      setStatusMessage(`Saved ${fileName} and updated inbox_index.json.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save that profile picture.');
    } finally {
      setUploadingThreadId('');
    }
  }

  return (
    <ActionPanelOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Manage local profile pictures and archive viewer preferences."
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-sm font-semibold text-white">Local profile picture manager</h3>
          <p className="mt-1 text-sm text-white/58">
            Upload JPG, PNG, WEBP, or GIF files up to 4MB. They are saved automatically into
            <span className="mx-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/72">public/assets/upload</span>
            and the inbox index is updated for you.
          </p>

          {statusMessage ? <p className="mt-3 text-sm text-emerald-300">{statusMessage}</p> : null}
          {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Direct messages missing profile pictures</h3>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
              {missingConversations.length} missing
            </span>
          </div>

          {missingConversations.length > 0 ? (
            <div className="space-y-3">
              {missingConversations.map((conversation) => (
                <div
                  key={conversation.threadId}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#141821] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{conversation.displayName}</p>
                    <p className="mt-1 truncate text-xs text-white/45">{conversation.threadId}</p>
                  </div>

                  <div className="shrink-0">
                    <input
                      ref={(element) => {
                        inputRefs.current[conversation.threadId] = element;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => handleUpload(conversation, event)}
                    />
                    <button
                      type="button"
                      onClick={() => inputRefs.current[conversation.threadId]?.click()}
                      disabled={uploadingThreadId === conversation.threadId}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      {uploadingThreadId === conversation.threadId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[#141821] px-4 py-4 text-sm text-white/62">
              Every direct message already has an image assigned.
            </div>
          )}
        </div>
      </div>
    </ActionPanelOverlay>
  );
};

export default InboxSettingsOverlay;
