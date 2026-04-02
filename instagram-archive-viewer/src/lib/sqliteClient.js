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
