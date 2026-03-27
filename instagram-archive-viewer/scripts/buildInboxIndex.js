import fs from "fs";
import path from "path";

const targetDir = process.argv[2];

function safeReadJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		return null;
	}
}

function formatPreview(message) {
	if (!message) {
		return "No messages yet";
	}

	if (typeof message.content === "string" && message.content.trim()) {
		return message.content.trim();
	}

	if (Array.isArray(message.photos) && message.photos.length > 0) {
		return "Sent a photo";
	}

	if (Array.isArray(message.videos) && message.videos.length > 0) {
		return "Sent a video";
	}

	if (Array.isArray(message.audio_files) && message.audio_files.length > 0) {
		return "Sent an audio message";
	}

	if (Array.isArray(message.audio) && message.audio.length > 0) {
		return "Sent an audio message";
	}

	if (Array.isArray(message.files) && message.files.length > 0) {
		return "Sent a file";
	}

	if (message.share?.link) {
		return message.share.share_text?.trim() || "Shared a link";
	}

	if (message.reactions?.length) {
		return "Reacted to a message";
	}

	return "Sent a message";
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

	const latestMessage =
		threadData.messages
			.filter((message) => typeof message?.timestamp_ms === "number")
			.sort((a, b) => b.timestamp_ms - a.timestamp_ms)[0] || null;

	return {
		threadId: path.basename(threadDir),
		threadPath: path.relative(targetDir, threadDir).replace(/\\/g, "/"),
		participants,
		title: conversationTitle,
		isGroup,
		imageUri: threadData.image?.uri || "",
		lastMessageAt: latestMessage?.timestamp_ms || 0,
		lastMessageSender: latestMessage?.sender_name || "",
		lastMessagePreview: formatPreview(latestMessage),
		messageCount: threadData.messages.length,
		hasMessages: threadData.messages.length > 0,
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
