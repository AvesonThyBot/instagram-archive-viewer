/* global process */
import fs from "fs";
import path from "path";
import { formatMessagePreview, normalizeMessage, resolveConversationImageUri } from "./archiveMessageUtils.js";

const targetDir = process.argv[2];

// The inbox index is intentionally lightweight so the sidebar can load without opening SQLite first.
function safeReadJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		return null;
	}
}

function pickOwnerName(conversations) {
	const counts = new Map();

	conversations.forEach((conversation) => {
		conversation.participants.forEach((participant) => {
			const currentCount = counts.get(participant) || 0;
			counts.set(participant, currentCount + 1);
		});
	});

	return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function buildConversationSummary(threadDir) {
	const messagesPath = path.join(threadDir, "messages.json");
	const threadData = safeReadJson(messagesPath);

	if (!threadData || !Array.isArray(threadData.messages)) {
		return null;
	}

	const participants = Array.isArray(threadData.participants)
		? threadData.participants
				.map((participant) => participant?.name)
				.filter(Boolean)
		: [];

	const isGroup = participants.length > 2;
	const conversationTitle =
		typeof threadData.title === "string" && threadData.title.trim()
			? threadData.title.trim()
			: "";

	const normalizedMessages = threadData.messages
		.map((message) => normalizeMessage(message))
		.filter(Boolean);

	const latestMessage =
		normalizedMessages
			.filter((message) => typeof message?.timestampMs === "number")
			.sort((a, b) => b.timestampMs - a.timestampMs)[0] || null;

	return {
		threadId: path.basename(threadDir),
		threadPath: path.relative(targetDir, threadDir).replace(/\\/g, "/"),
		participants,
		title: conversationTitle,
		isGroup,
		imageUri: resolveConversationImageUri(threadData),
		lastMessageAt: latestMessage?.timestampMs || 0,
		lastMessageSender: latestMessage?.senderName || "",
		lastMessagePreview: formatMessagePreview(latestMessage?.raw),
		messageCount: normalizedMessages.length,
		hasMessages: normalizedMessages.length > 0,
	};
}

function run() {
	if (!targetDir || !fs.existsSync(targetDir)) {
		console.error("Could not find the Instagram activity folder.");
		process.exit(1);
	}

	const inboxDir = path.join(targetDir, "messages", "inbox");

	if (!fs.existsSync(inboxDir)) {
		console.error("Could not find messages/inbox in the Instagram activity folder.");
		process.exit(1);
	}

	console.log("Gathering your inbox conversations...");

	const threadDirs = fs
		.readdirSync(inboxDir)
		.map((entry) => path.join(inboxDir, entry))
		.filter((entry) => fs.statSync(entry).isDirectory())
		.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

	const conversations = [];

	threadDirs.forEach((threadDir, index) => {
		const threadId = path.basename(threadDir);
		process.stdout.write(`   [${index + 1}/${threadDirs.length}] Reading ${threadId}...\r`);

		const summary = buildConversationSummary(threadDir);
		if (summary) {
			conversations.push(summary);
		}
	});

	process.stdout.write(" ".repeat(120) + "\r");

	const ownerName = pickOwnerName(conversations);
	const sortedConversations = conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
	const outputPath = path.join(targetDir, "messages", "inbox_index.json");

	const output = {
		generatedAt: new Date().toISOString(),
		ownerName,
		conversationCount: sortedConversations.length,
		conversations: sortedConversations,
	};

	fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

	console.log(`Inbox index ready: ${sortedConversations.length} conversations saved to messages/inbox_index.json`);
}

run();
