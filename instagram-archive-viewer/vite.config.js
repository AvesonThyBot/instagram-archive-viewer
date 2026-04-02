/* global Buffer, process */
import { execFileSync } from "child_process";
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
          const { threadId, displayName, fileName, mimeType, dataUrl } = body || {};

          if (!threadId || !dataUrl) {
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

          if (!fs.existsSync(inboxIndexPath)) {
            throw new Error("Could not find inbox_index.json for this project.");
          }

          fs.mkdirSync(uploadDir, { recursive: true });

          const nextIndexData = JSON.parse(fs.readFileSync(inboxIndexPath, "utf8"));
          const targetConversation = nextIndexData.conversations?.find((conversation) => conversation.threadId === threadId);

          if (!targetConversation) {
            throw new Error("Could not find that conversation in the inbox index.");
          }

          const resolvedDisplayName = displayName || targetConversation.title || targetConversation.threadId;
          const extension = getExtension(mimeType, fileName || "");
          const outputName = `${sanitizeBaseName(resolvedDisplayName)}-${threadId}.${extension}`;
          const outputPath = path.join(uploadDir, outputName);
          fs.writeFileSync(outputPath, fileBuffer);

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

function copyDirectory(sourceDir, destinationDir, filter) {
  fs.cpSync(sourceDir, destinationDir, {
    recursive: true,
    filter: (currentSource) => (filter ? filter(currentSource) : true),
  });
}

function exportPackagePlugin() {
  return {
    name: "export-selected-package",
    configureServer(server) {
      server.middlewares.use("/api/export-package", async (req, res) => {
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
          const selectedThreadIds = Array.isArray(body?.selectedThreadIds) ? body.selectedThreadIds : [];
          const destinationPath = typeof body?.destinationPath === "string" ? body.destinationPath.trim() : "";

          if (selectedThreadIds.length === 0) {
            throw new Error("Select at least one conversation to export.");
          }

          const projectRoot = server.config.root;
          const repoRoot = path.dirname(projectRoot);
          const sourceDataDir = path.join(projectRoot, "public", "data", "your_instagram_activity");
          const sourceInboxDir = path.join(sourceDataDir, "messages", "inbox");
          const sourceAssetsDir = path.join(projectRoot, "public", "assets");
          const scriptsDir = path.join(projectRoot, "scripts");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const exportBaseDir = destinationPath || path.join(repoRoot, "exports");
          const exportAppDir = path.join(exportBaseDir, `instagram-archive-viewer-export-${timestamp}`);
          const exportPublicDir = path.join(exportAppDir, "public");
          const exportAssetsDir = path.join(exportPublicDir, "assets");
          const exportDataDir = path.join(exportPublicDir, "data", "your_instagram_activity");
          const exportInboxDir = path.join(exportDataDir, "messages", "inbox");

          fs.rmSync(exportAppDir, { recursive: true, force: true });
          fs.mkdirSync(exportInboxDir, { recursive: true });
          fs.mkdirSync(exportAppDir, { recursive: true });

          copyDirectory(projectRoot, exportAppDir, (currentSource) => {
            const relativePath = path.relative(projectRoot, currentSource);
            if (!relativePath) {
              return true;
            }

            const normalized = relativePath.replace(/\\/g, "/");
            if (normalized.startsWith("node_modules")) return false;
            if (normalized.startsWith("scripts")) return false;
            if (normalized.startsWith("public/data/your_instagram_activity")) return false;
            return true;
          });

          if (fs.existsSync(sourceAssetsDir)) {
            fs.mkdirSync(exportAssetsDir, { recursive: true });
            copyDirectory(sourceAssetsDir, exportAssetsDir);
          }

          selectedThreadIds.forEach((threadId) => {
            const sourceThreadDir = path.join(sourceInboxDir, threadId);
            if (fs.existsSync(sourceThreadDir)) {
              copyDirectory(sourceThreadDir, path.join(exportInboxDir, threadId));
            }
          });

          const runScript = (scriptName) => {
            execFileSync(
              process.execPath,
              [path.join(scriptsDir, scriptName), exportDataDir],
              { cwd: projectRoot, stdio: "inherit" },
            );
          };

          runScript("buildInboxIndex.js");
          runScript("buildMessageDatabase.js");

          if (process.platform === "win32") {
            execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm install --silent"], {
              cwd: exportAppDir,
              stdio: "inherit",
            });
          } else {
            execFileSync("npm", ["install", "--silent"], {
              cwd: exportAppDir,
              stdio: "inherit",
            });
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            exportPath: exportAppDir,
            conversationCount: selectedThreadIds.length,
          }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Could not export the selected conversations.",
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), profilePictureUploadPlugin(), exportPackagePlugin()],
});
