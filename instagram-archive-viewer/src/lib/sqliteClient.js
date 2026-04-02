import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DATABASE_URL = '/data/your_instagram_activity/messages/archive.sqlite';

let sqlPromise = null;
let databasePromise = null;

function mapRows(result) {
  if (!result?.columns || !Array.isArray(result.values)) {
    return [];
  }

  return result.values.map((valueRow) =>
    result.columns.reduce((row, column, index) => {
      row[column] = valueRow[index];
      return row;
    }, {}),
  );
}

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }

  return sqlPromise;
}

export async function getArchiveDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const SQL = await getSql();
      const response = await fetch(DATABASE_URL);

      if (!response.ok) {
        throw new Error('Could not load the message database.');
      }

      const arrayBuffer = await response.arrayBuffer();
      return new SQL.Database(new Uint8Array(arrayBuffer));
    })();
  }

  return databasePromise;
}

export async function getConversationMessagePage(threadId, beforeTimestamp = null, limit = 50) {
  const db = await getArchiveDatabase();
  const sql = beforeTimestamp
    ? `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ? AND timestamp_ms < ?
        ORDER BY timestamp_ms DESC
        LIMIT ?
      `
    : `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ?
        ORDER BY timestamp_ms DESC
        LIMIT ?
      `;

  const params = beforeTimestamp ? [threadId, beforeTimestamp, limit] : [threadId, limit];
  const rows = mapRows(db.exec(sql, params)[0]).reverse();

  return rows.map((row) => ({
    ...row,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : { attachments: [], raw: {} },
  }));
}

export async function getConversationMediaPage(threadId, tab, beforeTimestamp = null, limit = 30) {
  const db = await getArchiveDatabase();
  const tabFilters = {
    MEDIA: "type IN ('photo', 'video')",
    REELS: "type = 'reel'",
    LINKS: "type IN ('link', 'gif') AND share_link NOT LIKE '%instagram.com/%'",
  };

  const filterSql = tabFilters[tab] || tabFilters.MEDIA;
  const sql = beforeTimestamp
    ? `
        SELECT type, preview_text, asset_uri, share_link, timestamp_ms, metadata_json
        FROM messages
        WHERE thread_id = ?
          AND ${filterSql}
          AND timestamp_ms < ?
        ORDER BY timestamp_ms DESC
        LIMIT ?
      `
    : `
        SELECT type, preview_text, asset_uri, share_link, timestamp_ms, metadata_json
        FROM messages
        WHERE thread_id = ?
          AND ${filterSql}
        ORDER BY timestamp_ms DESC
        LIMIT ?
      `;

  const params = beforeTimestamp ? [threadId, beforeTimestamp, limit] : [threadId, limit];
  const results = db.exec(sql, params);

  return mapRows(results[0]).map((row) => ({
    ...row,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : { attachments: [], raw: {} },
  }));
}

function mapMessageRows(results) {
  return mapRows(results[0]).map((row) => ({
    ...row,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : { attachments: [], raw: {} },
  }));
}

function buildSearchClauses(threadId, filters) {
  const clauses = ['thread_id = ?'];
  const params = [threadId];

  if (filters.from) {
    clauses.push('LOWER(sender_name) = ?');
    params.push(filters.from.toLowerCase());
  }

  if (filters.has) {
    clauses.push('type = ?');
    params.push(filters.has.toLowerCase());
  }

  if (filters.before) {
    clauses.push('timestamp_ms < ?');
    params.push(filters.before);
  }

  if (filters.after) {
    clauses.push('timestamp_ms > ?');
    params.push(filters.after);
  }

  if (filters.on) {
    const start = new Date(filters.on);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    clauses.push('timestamp_ms >= ? AND timestamp_ms < ?');
    params.push(start.getTime(), end.getTime());
  }

  for (const token of filters.text) {
    const lowerToken = token.toLowerCase();
    // Very short tokens are treated more strictly so searches like "hi" do not explode
    // into unrelated matches across every longer word in the conversation.
    if (token.length < 3) {
      clauses.push(`(
        LOWER(text_content) = ?
        OR LOWER(preview_text) = ?
        OR LOWER(share_link) = ?
        OR LOWER(text_content) LIKE ?
        OR LOWER(preview_text) LIKE ?
        OR LOWER(share_link) LIKE ?
        OR LOWER(text_content) LIKE ?
        OR LOWER(preview_text) LIKE ?
        OR LOWER(share_link) LIKE ?
        OR LOWER(text_content) LIKE ?
        OR LOWER(preview_text) LIKE ?
        OR LOWER(share_link) LIKE ?
      )`);
      params.push(
        lowerToken,
        lowerToken,
        lowerToken,
        `${lowerToken} %`,
        `${lowerToken} %`,
        `${lowerToken} %`,
        `% ${lowerToken} %`,
        `% ${lowerToken} %`,
        `% ${lowerToken} %`,
        `% ${lowerToken}`,
        `% ${lowerToken}`,
        `% ${lowerToken}`,
      );
    } else {
      clauses.push('(LOWER(text_content) LIKE ? OR LOWER(preview_text) LIKE ? OR LOWER(share_link) LIKE ?)');
      params.push(`%${lowerToken}%`, `%${lowerToken}%`, `%${lowerToken}%`);
    }
  }

  return { clauses, params };
}

export async function searchConversationMessages(threadId, filters, offset = 0, limit = 30) {
  const db = await getArchiveDatabase();
  const { clauses, params } = buildSearchClauses(threadId, filters);

  const sql = `
    SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
           preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
    FROM messages
    WHERE ${clauses.join(' AND ')}
    ORDER BY timestamp_ms DESC
    LIMIT ? OFFSET ?
  `;

  const resultRows = mapMessageRows(db.exec(sql, [...params, limit, offset]));
  return resultRows;
}

export async function countConversationSearchResults(threadId, filters) {
  const db = await getArchiveDatabase();
  const { clauses, params } = buildSearchClauses(threadId, filters);
  const results = db.exec(
    `
      SELECT COUNT(*) AS total
      FROM messages
      WHERE ${clauses.join(' AND ')}
    `,
    params,
  );

  return Number(results?.[0]?.values?.[0]?.[0] || 0);
}

export async function getMessageContext(threadId, timestampMs, limitBefore = 50, limitAfter = 50) {
  const db = await getArchiveDatabase();

  // Context search opens around one timestamp anchor so we can load above and below it
  // without re-scanning the entire archive on the client.
  const beforeRows = mapMessageRows(
    db.exec(
      `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ? AND timestamp_ms < ?
        ORDER BY timestamp_ms DESC
        LIMIT ?
      `,
      [threadId, timestampMs, limitBefore],
    ),
  ).reverse();

  const centerRows = mapMessageRows(
    db.exec(
      `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ? AND timestamp_ms = ?
        ORDER BY message_id ASC
      `,
      [threadId, timestampMs],
    ),
  );

  const afterRows = mapMessageRows(
    db.exec(
      `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ? AND timestamp_ms > ?
        ORDER BY timestamp_ms ASC
        LIMIT ?
      `,
      [threadId, timestampMs, limitAfter],
    ),
  );

  return {
    messages: [...beforeRows, ...centerRows, ...afterRows],
    hasOlder: beforeRows.length === limitBefore,
    hasNewer: afterRows.length === limitAfter,
  };
}

export async function getMessagesNewerThan(threadId, afterTimestamp, limit = 50) {
  const db = await getArchiveDatabase();
  return mapMessageRows(
    db.exec(
      `
        SELECT message_id, thread_id, timestamp_ms, sender_name, type, category, text_content,
               preview_text, asset_uri, asset_kind, share_link, call_duration, reaction_count, metadata_json
        FROM messages
        WHERE thread_id = ? AND timestamp_ms > ?
        ORDER BY timestamp_ms ASC
        LIMIT ?
      `,
      [threadId, afterTimestamp, limit],
    ),
  );
}
