import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  LoaderCircle,
  Search,
  Settings2,
  UserRound,
  Link as LinkIcon,
  Hash,
  X,
} from 'lucide-react';
import {
  countConversationSearchResults,
  searchConversationMessages,
} from '../lib/sqliteClient';
import {
  applySuggestion,
  getActiveFilterInput,
  getHighlightTerms,
  getSearchSuggestions,
  getSearchTokens,
  parseSearchInput,
} from '../lib/searchQuery';

const RESULT_PAGE_SIZE = 30;

function formatResultTime(timestampMs) {
  return new Date(timestampMs).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Search results highlight matched text inline so users can judge relevance before jumping.
function highlightText(text, terms) {
  if (!text) {
    return '';
  }

  if (terms.length === 0) {
    return text;
  }

  const escapedTerms = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());
    return isMatch ? <strong key={`${part}-${index}`} className="font-extrabold text-white">{part}</strong> : part;
  });
}

const SearchOverlay = ({ isOpen, onClose, participants, threadId, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [beforeDate, setBeforeDate] = useState('');
  const [afterDate, setAfterDate] = useState('');

  const suggestions = useMemo(() => getSearchSuggestions(query, participants), [participants, query]);
  const searchTokens = useMemo(() => getSearchTokens(query), [query]);
  const activeFilterInput = useMemo(() => getActiveFilterInput(query), [query]);
  const parsedFilters = useMemo(() => parseSearchInput(submittedQuery), [submittedQuery]);
  const highlightTerms = useMemo(() => getHighlightTerms(parsedFilters), [parsedFilters]);
  const pageCount = Math.max(1, Math.ceil(totalResults / RESULT_PAGE_SIZE));

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSubmittedQuery('');
      setCurrentPage(1);
      setTotalResults(0);
      setShowFilters(false);
      setBeforeDate('');
      setAfterDate('');
    }
  }, [isOpen]);

  async function runSearch(page = 1, nextSubmittedQuery = submittedQuery) {
    if (!threadId || !nextSubmittedQuery) {
      return;
    }

    const filters = parseSearchInput(nextSubmittedQuery);
    const offset = (page - 1) * RESULT_PAGE_SIZE;

    setIsSearching(true);
    try {
      const [rows, total] = await Promise.all([
        searchConversationMessages(threadId, filters, offset, RESULT_PAGE_SIZE),
        countConversationSearchResults(threadId, filters),
      ]);

      setResults(rows);
      setTotalResults(total);
      setCurrentPage(page);
    } finally {
      setIsSearching(false);
    }
  }

  function mergeDateFilters(baseQuery) {
    let next = baseQuery.trim();
    next = next.replace(/\b(before|after):\S+/gi, '').replace(/\s+/g, ' ').trim();

    if (beforeDate) {
      next = `${next}${next ? ' ' : ''}before:${beforeDate}`;
    }

    if (afterDate) {
      next = `${next}${next ? ' ' : ''}after:${afterDate}`;
    }

    return next.trim();
  }

  function submitSearch(nextQuery = query) {
    const merged = mergeDateFilters(nextQuery);
    const trimmed = merged.trim();
    if (!trimmed) {
      return;
    }

    setQuery(trimmed);
    setSubmittedQuery(trimmed);
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
  }

  useEffect(() => {
    if (!submittedQuery) {
      return;
    }

    runSearch(1, submittedQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery]);

  function clearSearch() {
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setBeforeDate('');
    setAfterDate('');
  }

  function insertFilterToken(token) {
    setQuery((current) => `${current}${current.endsWith(' ') || current.length === 0 ? '' : ' '}${token}`);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[68] bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-end justify-center md:items-center md:p-6">
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-white/10 bg-[#121318] shadow-2xl sm:h-[94dvh] sm:rounded-t-3xl md:h-auto md:max-h-[86vh] md:w-[min(92vw,760px)] md:rounded-3xl">
          <div className="flex items-center border-b border-white/10 px-4 py-4">
            <button onClick={onClose} className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold text-white">Search</span>
          </div>

          <div className="border-b border-white/10 px-4 py-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 shrink-0 text-white/55" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search messages, links, from:, has:, before:, after:, time:"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex h-7 w-7 items-center justify-center rounded-full p-0 text-white/55"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0 ${showFilters ? 'bg-white/10 text-white' : 'text-white/55'}`}
                  aria-label="Open filters"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              {searchTokens.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {searchTokens.map((token, index) => (
                    <span
                      key={`${token.raw}-${index}`}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        token.kind === 'text'
                          ? 'bg-white/[0.06] text-white/82'
                          : 'border border-[#6f86ff]/35 bg-[#4f5eff]/12 text-[#c9d1ff]'
                      }`}
                    >
                      {token.prefix ? (
                        <>
                          <span className="text-white/55">{token.prefix}</span>
                          <span>{token.label}</span>
                        </>
                      ) : (
                        token.label
                      )}
                    </span>
                  ))}
                </div>
              )}
            </form>

            {suggestions.length > 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#181a21] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                {suggestions.map((item) => (
                  <button
                    key={`${item.tokenPrefix || 'plain'}-${item.label}`}
                    type="button"
                    onClick={() => {
                      setQuery((current) => applySuggestion(current, item));
                      if (item.opensDatePicker === 'before') {
                        setShowFilters(true);
                      }
                      if (item.opensDatePicker === 'after') {
                        setShowFilters(true);
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/[0.06]"
                  >
                    <span className="text-sm text-white">
                      {item.label}
                    </span>
                    <span className="text-xs text-white/45">{item.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showFilters && (
            <div className="border-b border-white/10 px-4 py-4">
              <p className="mb-3 text-sm font-semibold text-white/85">Filters</p>
              <div className="space-y-2">
                {[
                  { icon: UserRound, title: 'From a specific user', hint: 'from:' },
                  { icon: Hash, title: 'Includes a specific type of data', hint: 'has:' },
                  { icon: LinkIcon, title: 'More filters', hint: 'before:, after:, time:' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => insertFilterToken(item.hint)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-4 text-left hover:bg-white/[0.06]"
                    >
                      <Icon className="h-5 w-5 text-white/60" />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-sm text-white/45">{item.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(activeFilterInput === 'after' || activeFilterInput === 'before') && (
                <div className="mt-4 rounded-2xl bg-white/[0.04] p-4">
                  {activeFilterInput === 'after' ? (
                    <label className="text-sm text-white/75">
                      <span className="mb-2 block">After</span>
                      <input
                        type="date"
                        value={afterDate}
                        onChange={(event) => setAfterDate(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#191b22] px-3 py-2 text-white outline-none"
                      />
                    </label>
                  ) : (
                    <label className="text-sm text-white/75">
                      <span className="mb-2 block">Before</span>
                      <input
                        type="date"
                        value={beforeDate}
                        onChange={(event) => setBeforeDate(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#191b22] px-3 py-2 text-white outline-none"
                      />
                    </label>
                  )}
                </div>
              )}

              {activeFilterInput === 'time' && (
                <div className="mt-4 rounded-2xl bg-white/[0.04] p-4">
                  <div className="flex flex-wrap gap-2">
                    {['today', 'week', 'month'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setQuery((current) => applySuggestion(current, {
                          label: chip,
                          replaceActiveToken: true,
                          tokenPrefix: 'time:',
                        }))}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {submittedQuery ? (
            <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm text-white/55">
                  Found <span className="text-white">{totalResults}</span> results
                </div>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {results.map((message) => {
                  const preview = message.text_content || message.preview_text || message.share_link;
                  return (
                    <button
                      key={message.message_id}
                      type="button"
                      onClick={() => onSelectResult?.(message)}
                      className="w-full rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))] p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.24)] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.045))]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-white">{message.sender_name}</span>
                        <span className="shrink-0 text-xs text-white/45">{formatResultTime(message.timestamp_ms)}</span>
                      </div>
                      <p className="line-clamp-4 text-sm leading-6 text-white/85">
                        {highlightText(preview, highlightTerms)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <button
                  type="button"
                  onClick={() => runSearch(Math.max(1, currentPage - 1), submittedQuery)}
                  disabled={currentPage === 1 || isSearching}
                  className="rounded-xl px-3 py-2 text-sm text-white disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-sm text-white/70">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => runSearch(Math.min(pageCount, currentPage + 1), submittedQuery)}
                  disabled={currentPage >= pageCount || isSearching}
                  className="rounded-xl px-3 py-2 text-sm text-white disabled:opacity-30"
                >
                  Next
                </button>
              </div>

              {isSearching && (
                <div className="mt-4 flex items-center justify-center">
                  <LoaderCircle className="h-5 w-5 animate-spin text-white/70" />
                </div>
              )}

              {!isSearching && results.length === 0 && (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-white/55">
                  No messages matched that search.
                </div>
              )}
            </div>
          ) : (
            !showFilters && (
              <div className="px-4 py-4">
                <p className="mb-3 text-sm font-semibold text-white/85">Filters</p>
                <div className="space-y-2">
                  {[
                    { icon: UserRound, title: 'From a specific user', hint: 'from: user' },
                    { icon: Hash, title: 'Includes a specific type of data', hint: 'has: link, photo, reel, file' },
                    { icon: LinkIcon, title: 'More filters', hint: 'before:, after:, time:' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                      key={item.title}
                      type="button"
                      onClick={() => setQuery(`${item.hint}`)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-4 text-left hover:bg-white/[0.06]"
                    >
                        <Icon className="h-5 w-5 text-white/60" />
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-sm text-white/45">{item.hint}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
