import { useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, Search } from 'lucide-react';
import ActionPanelOverlay from './ActionPanelOverlay';

const InboxExportOverlay = ({ isOpen, onClose, indexData }) => {
  const conversations = useMemo(() => indexData?.conversations || [], [indexData]);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [destinationPath, setDestinationPath] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedThreadIds([]);
      setStatusMessage('');
      setErrorMessage('');
      setIsExporting(false);
      setSearchValue('');
      setDestinationPath('');
    }
  }, [isOpen]);

  const selectedCount = selectedThreadIds.length;
  const selectedSet = useMemo(() => new Set(selectedThreadIds), [selectedThreadIds]);
  const filteredConversations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const title = (conversation.title || conversation.threadId || '').toLowerCase();
      const preview = (conversation.lastMessagePreview || '').toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [conversations, searchValue]);

  function toggleConversation(threadId) {
    setSelectedThreadIds((current) => (
      current.includes(threadId)
        ? current.filter((id) => id !== threadId)
        : [...current, threadId]
    ));
  }

  function selectAll() {
    setSelectedThreadIds(filteredConversations.map((conversation) => conversation.threadId));
  }

  function deselectAll() {
    setSelectedThreadIds([]);
  }

  async function handleExport() {
    if (selectedThreadIds.length === 0) {
      setErrorMessage('Select at least one conversation to export.');
      return;
    }

    setIsExporting(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/export-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedThreadIds, destinationPath }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not export those conversations.');
      }

      setStatusMessage(`Export created at ${payload.exportPath} with ${payload.conversationCount} conversations.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not export those conversations.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ActionPanelOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Export"
      description="Create a hosted-ready package with only the selected inbox conversations."
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/70">
            The export keeps only the conversations you select, rebuilds <span className="font-semibold text-white">inbox_index.json</span>,
            rebuilds the SQLite database, installs dependencies, and leaves out setup-only files like <span className="font-semibold text-white">install.sh</span>,
            <span className="font-semibold text-white"> scripts</span>, and root git files.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white"
            >
              Deselect all
            </button>
            <span className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/65">
              {selectedCount} selected
            </span>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Export destination
            </span>
            <input
              value={destinationPath}
              onChange={(event) => setDestinationPath(event.target.value)}
              placeholder="Optional: paste a folder path for the export package"
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/55">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search conversations to export"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </label>

        <div className="app-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredConversations.map((conversation) => {
            const isSelected = selectedSet.has(conversation.threadId);
            return (
              <button
                key={conversation.threadId}
                type="button"
                onClick={() => toggleConversation(conversation.threadId)}
                className={`flex w-full items-start justify-between gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                  isSelected ? 'border-white/25 bg-white/[0.08]' : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {conversation.title || conversation.threadId}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/45">
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </p>
                </div>

                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  isSelected ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/15 text-transparent'
                }`}>
                  <Check className="h-4 w-4" />
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-white/55">
              No conversations matched that search.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-auto border-t border-white/10 bg-[#0f1218] px-4 pb-1 pt-4">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Ready To Export</p>
                <p className="mt-1 text-sm text-white/78">
                  {selectedCount === 0 ? 'Choose conversations to include in the hosted package.' : `${selectedCount} conversations selected for export.`}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm font-semibold text-white">
                {selectedCount}
              </div>
            </div>

            {statusMessage ? <p className="mb-3 text-sm text-emerald-300">{statusMessage}</p> : null}
            {errorMessage ? <p className="mb-3 text-sm text-red-300">{errorMessage}</p> : null}

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || selectedCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white px-4 py-4 text-sm font-semibold text-black disabled:opacity-50"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              <span>{isExporting ? 'Building export...' : 'Export selected conversations'}</span>
            </button>
          </div>
        </div>
      </div>
    </ActionPanelOverlay>
  );
};

export default InboxExportOverlay;
