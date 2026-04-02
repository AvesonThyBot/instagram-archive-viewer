// Search chips are still stored as plain text so the query can be pasted, edited, and reused easily.
function normalizeDateFilter(value) {
  const query = value.trim().toLowerCase();
  const now = new Date();

  if (query === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { after: start };
  }

  if (query === 'week') {
    return { after: now.getTime() - 7 * 24 * 60 * 60 * 1000 };
  }

  if (query === 'month') {
    return { after: now.getTime() - 30 * 24 * 60 * 60 * 1000 };
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return { on: parsed };
  }

  return {};
}

function splitTokens(input) {
  return input.trim().split(/\s+/).filter(Boolean);
}

function getActiveToken(input) {
  const tokens = splitTokens(input);
  return tokens[tokens.length - 1] || '';
}

export function parseSearchInput(input) {
  const tokens = splitTokens(input);
  const filters = {
    text: [],
    from: '',
    has: '',
    before: null,
    after: null,
    on: null,
  };

  tokens.forEach((token) => {
    const lower = token.toLowerCase();

    // Search filters are encoded inline so the query can stay shareable and easy to type.
    if (lower.startsWith('from:')) {
      filters.from = token.slice(5).trim();
      return;
    }

    if (lower.startsWith('has:')) {
      filters.has = token.slice(4).trim().toLowerCase();
      return;
    }

    if (lower.startsWith('before:')) {
      const parsed = Date.parse(token.slice(7));
      if (!Number.isNaN(parsed)) {
        filters.before = parsed;
      }
      return;
    }

    if (lower.startsWith('after:')) {
      const parsed = Date.parse(token.slice(6));
      if (!Number.isNaN(parsed)) {
        filters.after = parsed;
      }
      return;
    }

    if (lower.startsWith('on:') || lower.startsWith('time:')) {
      const dateResult = normalizeDateFilter(token.includes(':') ? token.split(':').slice(1).join(':') : '');
      if (dateResult.on) filters.on = dateResult.on;
      if (dateResult.after) filters.after = dateResult.after;
      return;
    }

    filters.text.push(token);
  });

  return filters;
}

export function getSearchSuggestions(input, participants) {
  const trimmed = input.trimStart();
  const lower = trimmed.toLowerCase();
  const activeToken = getActiveToken(input);
  const activeLower = activeToken.toLowerCase();

  if (activeLower.startsWith('from:')) {
    const partial = activeToken.slice(5).toLowerCase();
    return participants
      .filter((name) => name.toLowerCase().includes(partial))
      .map((name) => ({
        label: name,
        description: `Messages from ${name}`,
        replaceActiveToken: true,
        tokenPrefix: 'from:',
      }));
  }

  if (activeLower.startsWith('has:')) {
    const options = ['photo', 'video', 'reel', 'link', 'file', 'audio', 'text'];
    const partial = activeToken.slice(4).toLowerCase();
    return options
      .filter((option) => option.includes(partial))
      .map((option) => ({
        label: option,
        description: `Only ${option} messages`,
        replaceActiveToken: true,
        tokenPrefix: 'has:',
      }));
  }

  if (activeLower.startsWith('time:')) {
    const options = ['today', 'week', 'month'];
    const partial = activeToken.slice(5).toLowerCase();
    return options
      .filter((option) => option.includes(partial))
      .map((option) => ({
        label: option,
        description: `Messages from ${option}`,
        replaceActiveToken: true,
        tokenPrefix: 'time:',
      }));
  }

  if (activeLower.startsWith('before:')) {
    return [
      {
        label: 'Choose a date',
        description: 'Pick a date below',
        replaceActiveToken: false,
        tokenPrefix: 'before:',
        opensDatePicker: 'before',
      },
    ];
  }

  if (activeLower.startsWith('after:')) {
    return [
      {
        label: 'Choose a date',
        description: 'Pick a date below',
        replaceActiveToken: false,
        tokenPrefix: 'after:',
        opensDatePicker: 'after',
      },
    ];
  }

  if (lower === '' || /\s$/.test(input)) {
    return [
      { label: 'from:', description: 'Filter by sender', replaceActiveToken: false, tokenPrefix: 'from:' },
      { label: 'has:', description: 'Filter by message type', replaceActiveToken: false, tokenPrefix: 'has:' },
      { label: 'before:', description: 'Messages before a date', replaceActiveToken: false, tokenPrefix: 'before:' },
      { label: 'after:', description: 'Messages after a date', replaceActiveToken: false, tokenPrefix: 'after:' },
      { label: 'time:', description: 'Messages from today or recent ranges', replaceActiveToken: false, tokenPrefix: 'time:' },
    ];
  }

  if (['from', 'has', 'before', 'after', 'time'].some((token) => token.startsWith(lower))) {
    return [
      { label: 'from:', description: 'Filter by sender', replaceActiveToken: true, tokenPrefix: 'from:' },
      { label: 'has:', description: 'Filter by message type', replaceActiveToken: true, tokenPrefix: 'has:' },
      { label: 'before:', description: 'Messages before a date', replaceActiveToken: true, tokenPrefix: 'before:' },
      { label: 'after:', description: 'Messages after a date', replaceActiveToken: true, tokenPrefix: 'after:' },
      { label: 'time:', description: 'Messages from a time range', replaceActiveToken: true, tokenPrefix: 'time:' },
    ].filter((option) => option.label.startsWith(lower));
  }

  return [];
}

export function applySuggestion(currentInput, suggestion) {
  const tokens = splitTokens(currentInput);
  const value = suggestion.tokenPrefix && !suggestion.label.startsWith(suggestion.tokenPrefix)
    ? `${suggestion.tokenPrefix}${suggestion.label}`
    : suggestion.label;

  if (suggestion.replaceActiveToken && tokens.length > 0) {
    tokens[tokens.length - 1] = value;
    return `${tokens.join(' ')} `;
  }

  return `${currentInput}${currentInput.endsWith(' ') || currentInput.length === 0 ? '' : ' '}${value} `;
}

export function getHighlightTerms(filters) {
  return filters.text.filter((token) => token.length > 0);
}

export function getSearchTokens(input) {
  return splitTokens(input).map((token) => {
    const lower = token.toLowerCase();
    const prefixes = ['from:', 'has:', 'before:', 'after:', 'time:', 'on:'];
    const prefix = prefixes.find((candidate) => lower.startsWith(candidate));

    if (!prefix) {
      return {
        raw: token,
        kind: 'text',
        label: token,
      };
    }

    return {
      raw: token,
      kind: prefix.slice(0, -1),
      prefix,
      label: token.slice(prefix.length) || prefix,
    };
  });
}

export function getActiveFilterInput(input) {
  const activeToken = getActiveToken(input).toLowerCase();

  if (activeToken.startsWith('before:')) return 'before';
  if (activeToken.startsWith('after:')) return 'after';
  if (activeToken.startsWith('time:')) return 'time';
  return '';
}
