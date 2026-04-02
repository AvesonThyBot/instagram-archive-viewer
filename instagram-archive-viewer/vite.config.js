/* global Buffer */
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeBaseName(value) {
  return (value || "profile")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "profile";
}

function getExtension(mimeType, fileName) {
  const mimeExtension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }[mimeType];

  if (mimeExtension) {
    return mimeExtension;
  }

  return fileName.split(".").pop()?.toLowerCase() || "png";
}

function profilePictureUploadPlugin() {
  return {
    name: "profile-picture-upload",
    configureServer(server) {
      server.middlewares.use("/api/profile-picture", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed." }));
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }

          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const { indexData, threadId, displayName, fileName, mimeType, dataUrl } = body || {};

          if (!threadId || !displayName || !dataUrl || !indexData) {
            throw new Error("Missing upload details.");
          }

          if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
            throw new Error("Use a JPG, PNG, WEBP, or GIF image.");
          }

          const [, base64Payload = ""] = String(dataUrl).split(",");
          const fileBuffer = Buffer.from(base64Payload, "base64");

          if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
            throw new Error("Profile pictures must be 4MB or smaller.");
          }

          const projectRoot = server.config.root;
          const uploadDir = path.join(projectRoot, "public", "assets", "upload");
          const inboxIndexPath = path.join(
            projectRoot,
            "public",
            "data",
            "your_instagram_activity",
            "messages",
            "inbox_index.json",
          );

          fs.mkdirSync(uploadDir, { recursive: true });

          const extension = getExtension(mimeType, fileName || "");
          const outputName = `${sanitizeBaseName(displayName)}-${threadId}.${extension}`;
          const outputPath = path.join(uploadDir, outputName);
          fs.writeFileSync(outputPath, fileBuffer);

          const nextIndexData = structuredClone(indexData);
          const targetConversation = nextIndexData.conversations?.find((conversation) => conversation.threadId === threadId);

          if (!targetConversation) {
            throw new Error("Could not find that conversation in the inbox index.");
          }

          targetConversation.imageUri = `/assets/upload/${outputName}`;
          fs.writeFileSync(inboxIndexPath, JSON.stringify(nextIndexData, null, 2));

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            fileName: outputName,
            imageUri: targetConversation.imageUri,
            nextIndexData,
          }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Could not upload that profile picture.",
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), profilePictureUploadPlugin()],
});
