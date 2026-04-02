/* global Buffer, process */
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import {
  formatMessagePreview,
  normalizeMessage,
  resolveConversationImageUri,
} from './archiveMessageUtils.js';

const targetDir = process.argv[2];

// The SQLite build step turns many raw Instagram JSON files into one browser-friendly search database.
function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function pickOwnerName(conversations) {
  const counts = new Map();

  conversations.forEach((conversation) => {
    conversation.participants.forEach((participant) => {
      counts.set(participant, (counts.get(participant) || 0) + 1);
    });
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function inferConversationTitle(threadData, ownerName, threadId) {
  const participants = Array.isArray(threadData.participants)
    ? threadData.participants.map((participant) => participant?.name).filter(Boolean)
    : [];

  if (typeof threadData.title === 'string' && threadData.title.trim()) {
    return threadData.title.trim();
  }

  const otherParticipants = participants.filter((participant) => participant !== ownerName);
  return otherParticipants[0] || participants[0] || threadId;
}

function createConversationRecord(threadDir, ownerName) {
  const threadId = path.basename(threadDir);
  const messagesPath = path.join(threadDir, 'messages.json');
  const threadData = safeReadJson(messagesPath);

  if (!threadData || !Array.isArray(threadData.messages)) {
    return null;
  }

  const participants = Array.isArray(threadData.participants)
    ? threadData.participants.map((participant) => participant?.name).filter(Boolean)
    : [];

  const normalizedMessages = threadData.messages
    .map((message) => normalizeMessage(message))
    .filter(Boolean)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  const latestMessage = normalizedMessages[normalizedMessages.length - 1] || null;
  const title = inferConversationTitle(threadData, ownerName, threadId);
  const mediaCount = normalizedMessages.filter((message) => ['photo', 'video'].includes(message.type)).length;
  const reelsCount = normalizedMessages.filter((message) => message.type === 'reel').length;
  const linksCount = normalizedMessages.filter((message) => ['link', 'gif'].includes(message.type)).length;

  return {
    threadId,
    threadPath: path.relative(targetDir, threadDir).replace(/\\/g, '/'),
    participants,
    title,
    isGroup: participants.length > 2 ? 1 : 0,
    imageUri: resolveConversationImageUri(threadData),
    lastMessageAt: latestMessage?.timestampMs || 0,
    lastMessageSender: latestMessage?.senderName || '',
    lastMessagePreview: latestMessage ? formatMessagePreview(latestMessage.raw) : 'No messages yet',
    messageCount: normalizedMessages.length,
    mediaCount,
    reelsCount,
    linksCount,
    messages: normalizedMessages,
  };
}

function buildDatabase(conversations, ownerName) {
  return initSqlJs().then((SQL) => {
    const db = new SQL.Database();

    db.exec(`
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA temp_store = MEMORY;

      CREATE TABLE conversations (
        thread_id TEXT PRIMARY KEY,
        thread_path TEXT NOT NULL,
        title TEXT NOT NULL,
        participants_json TEXT NOT NULL,
        is_group INTEGER NOT NULL DEFAULT 0,
        image_uri TEXT NOT NULL,
        last_message_at INTEGER NOT NULL DEFAULT 0,
        last_message_sender TEXT NOT NULL DEFAULT '',
        last_message_preview TEXT NOT NULL DEFAULT '',
        message_count INTEGER NOT NULL DEFAULT 0,
        media_count INTEGER NOT NULL DEFAULT 0,
        reels_count INTEGER NOT NULL DEFAULT 0,
        links_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE messages (
        message_id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        timestamp_ms INTEGER NOT NULL,
        sender_name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        text_content TEXT NOT NULL DEFAULT '',
        preview_text TEXT NOT NULL,
        asset_uri TEXT NOT NULL DEFAULT '',
        asset_kind TEXT NOT NULL DEFAULT '',
        share_link TEXT NOT NULL DEFAULT '',
        call_duration INTEGER,
        reaction_count INTEGER NOT NULL DEFAULT 0,
        metadata_json TEXT NOT NULL
      );

      CREATE INDEX idx_messages_thread_timestamp ON messages(thread_id, timestamp_ms DESC);
      CREATE INDEX idx_messages_thread_type ON messages(thread_id, type);
    `);

    const insertConversation = db.prepare(`
      INSERT INTO conversations (
        thread_id,
        thread_path,
        title,
        participants_json,
        is_group,
        image_uri,
        last_message_at,
        last_message_sender,
        last_message_preview,
        message_count,
        media_count,
        reels_count,
        links_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMessage = db.prepare(`
      INSERT INTO messages (
        message_id,
        thread_id,
        timestamp_ms,
        sender_name,
        type,
        category,
        text_content,
        preview_text,
        asset_uri,
        asset_kind,
        share_link,
        call_duration,
        reaction_count,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    conversations.forEach((conversation, conversationIndex) => {
      process.stdout.write(
        `   [${conversationIndex + 1}/${conversations.length}] Writing ${conversation.threadId} to SQLite...\r`,
      );

      insertConversation.run([
        conversation.threadId,
        conversation.threadPath,
        conversation.title,
        JSON.stringify(conversation.participants),
        conversation.isGroup,
        conversation.imageUri,
        conversation.lastMessageAt,
        conversation.lastMessageSender,
        conversation.lastMessagePreview,
        conversation.messageCount,
        conversation.mediaCount,
        conversation.reelsCount,
        conversation.linksCount,
      ]);

      conversation.messages.forEach((message, index) => {
        insertMessage.run([
          `${conversation.threadId}:${message.timestampMs}:${index}`,
          conversation.threadId,
          message.timestampMs,
          message.senderName,
          message.type,
          message.category,
          message.textContent,
          message.previewText,
          message.assetUri,
          message.assetKind,
          message.shareLink,
          message.callDuration,
          message.reactionCount,
          JSON.stringify({
            attachments: message.attachments,
            raw: message.raw,
          }),
        ]);
      });
    });

    insertConversation.free();
    insertMessage.free();

    process.stdout.write(' '.repeat(120) + '\r');

    return {
      ownerName,
      buffer: Buffer.from(db.export()),
    };
  });
}

async function run() {
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error('Could not find the Instagram activity folder.');
    process.exit(1);
  }

  const inboxDir = path.join(targetDir, 'messages', 'inbox');

  if (!fs.existsSync(inboxDir)) {
    console.error('Could not find messages/inbox in the Instagram activity folder.');
    process.exit(1);
  }

  const threadDirs = fs
    .readdirSync(inboxDir)
    .map((entry) => path.join(inboxDir, entry))
    .filter((entry) => fs.statSync(entry).isDirectory())
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  console.log('Building your message database...');

  const ownerName = pickOwnerName(
    threadDirs
      .map((threadDir) => {
        const data = safeReadJson(path.join(threadDir, 'messages.json'));
        return {
          participants: Array.isArray(data?.participants)
            ? data.participants.map((participant) => participant?.name).filter(Boolean)
            : [],
        };
      })
      .filter((conversation) => conversation.participants.length > 0),
  );

  const conversations = threadDirs
    .map((threadDir) => createConversationRecord(threadDir, ownerName))
    .filter(Boolean);

  // Export a single SQLite file so the browser can page through message history without
  // reparsing every raw JSON thread on each view.
  const { buffer } = await buildDatabase(conversations, ownerName);
  const outputPath = path.join(targetDir, 'messages', 'archive.sqlite');
  fs.writeFileSync(outputPath, buffer);

  console.log(`SQLite database ready: ${conversations.length} conversations stored in messages/archive.sqlite`);
}

run();
