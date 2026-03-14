import fs from "fs";
import path from "path";
import readline from "readline";

const targetDir = process.argv[2];

let stats = {
	originalSize: 0,
	compressedSize: 0,
	chatsProcessed: 0,
};

// ----- Helper Functions -----

// fixEncoding(): fixes broken emojis and special characters
function fixEncoding(obj) {
	if (typeof obj === "string") {
		try {
			return Buffer.from(obj, "latin1").toString("utf8");
		} catch (e) {
			return obj;
		}
	}
	if (Array.isArray(obj)) return obj.map(fixEncoding);
	if (obj !== null && typeof obj === "object") {
		const newObj = {};
		for (const key in obj) {
			newObj[fixEncoding(key)] = fixEncoding(obj[key]);
		}
		return newObj;
	}
	return obj;
}

// formatBytes(): changes raw numbers into readable sizes like MB
function formatBytes(bytes) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// confirmUnification(): asks the user to type y or n before deleting files
async function confirmUnification() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`\nPROMPT: Ready to unify and DELETE original message parts? (y/n): `, (ans) => {
			rl.close();
			resolve(ans.toLowerCase() === "y");
		});
	});
}

// ----- Core Logic Functions -----

// getChatFolders(): looks for all folders inside the inbox
function getChatFolders(inboxPath) {
	return fs
		.readdirSync(inboxPath)
		.map((f) => path.join(inboxPath, f))
		.filter((f) => fs.statSync(f).isDirectory());
}

// processChat(): joins all message_X.json files into one messages.json file
function processChat(dir, index, total) {
	const chatName = path.basename(dir);
	const outputPath = path.join(dir, "messages.json");

	const messageFiles = fs
		.readdirSync(dir)
		.filter((f) => f.startsWith("message_") && f.endsWith(".json"))
		.map((f) => path.join(dir, f))
		.sort((a, b) => {
			const nA = parseInt(path.basename(a).match(/\d+/)[0]);
			const nB = parseInt(path.basename(b).match(/\d+/)[0]);
			return nA - nB;
		});

	console.log(`// [${index + 1}/${total}] Current Chat: ${chatName}`);

	try {
		let finalData = null;
		let allMessages = [];
		stats.chatsProcessed++;

		if (messageFiles.length > 0) {
			messageFiles.forEach((file, fIndex) => {
				stats.originalSize += fs.statSync(file).size;
				process.stdout.write(`   -> Reading Part ${fIndex + 1}/${messageFiles.length}... \r`);

				const content = JSON.parse(fs.readFileSync(file, "utf8"));

				if (!finalData) {
					finalData = content;
					allMessages = content.messages || [];
				} else {
					if (content.messages && Array.isArray(content.messages)) {
						allMessages.push(...content.messages);
					}
				}
			});

			finalData.messages = allMessages;
			process.stdout.write(" ".repeat(60) + "\r");
		}

		if (finalData) {
			const cleanedData = fixEncoding(finalData);

			// --- Output Selection ---
			const finalJson = JSON.stringify(cleanedData, null, 2); // Readable
			// const finalJson = JSON.stringify(cleanedData); // Minified
			// ------------------------

			stats.compressedSize += Buffer.byteLength(finalJson, "utf8");
			fs.writeFileSync(outputPath, finalJson);

			console.log(`   -> Status: Unified (${allMessages.length} messages captured).`);

			messageFiles.forEach((f) => fs.unlinkSync(f));
		}
	} catch (err) {
		console.log(`\n// Error Processing ${chatName}: ${err.message}`);
	}
}

// processExtras(): fixes the text and format of AI and Secret chat files
function processExtras() {
	console.log(`// ----- Processing Additional Conversations -----`);
	const extraFiles = ["ai_conversations.json", "reported_conversations.json", "secret_conversations.json"];

	extraFiles.forEach((file) => {
		const fullPath = path.join(targetDir, "messages", file);
		if (fs.existsSync(fullPath)) {
			try {
				stats.originalSize += fs.statSync(fullPath).size;
				const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
				const cleaned = fixEncoding(content);

				const formatted = JSON.stringify(cleaned, null, 2);
				stats.compressedSize += Buffer.byteLength(formatted, "utf8");
				fs.writeFileSync(fullPath, formatted);
				console.log(`   -> Optimized: ${file}`);
			} catch (e) {}
		}
	});
}

// ----- Execution Flow -----

// run(): starts the script and runs the other functions in order
async function run() {
	if (!targetDir || !fs.existsSync(targetDir)) {
		console.error("// Error: Valid target directory path is required.");
		process.exit(1);
	}

	const inboxPath = path.join(targetDir, "messages", "inbox");
	if (!fs.existsSync(inboxPath)) {
		console.error("// Error: Inbox folder not found.");
		process.exit(1);
	}

	const folders = getChatFolders(inboxPath);

	const proceed = await confirmUnification();
	if (!proceed) {
		console.log("Unification aborted.");
		process.exit(0);
	}

	console.log(`\n// ----- Starting Optimization: ${folders.length} Folders Found -----`);
	folders.forEach((dir, index) => processChat(dir, index, folders.length));

	processExtras();

	// ----- Final Stats Block -----
	const saved = stats.originalSize - stats.compressedSize;
	console.log("\n------------------------------------------------");
	console.log(`Optimization Results:`);
	console.log(`   - Total Chats: ${stats.chatsProcessed}`);
	console.log(`   - Data Size: ${formatBytes(stats.originalSize)} -> ${formatBytes(stats.compressedSize)}`);
	console.log("------------------------------------------------\n");
}

run();
