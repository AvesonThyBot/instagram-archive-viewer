---
title: Run the project locally
sidebar_position: 2
---

# Run the project locally

This is the fastest way to work on the viewer and test archive changes safely.

## Requirements

- Node.js 20 or newer
- npm
- a local copy of the app repository
- an extracted Instagram JSON export

## Local setup flow

1. Clone the repository.
2. Open the `instagram-archive-viewer` folder.
3. Install dependencies.
4. Place your archive data under `public/data`.
5. Start the dev server.

## Commands

```bash
cd instagram-archive-viewer
npm install
npm run dev
```

The Vite dev server will usually start on a local address like:

```text
http://localhost:5173
```

## Data build expectations

The current project includes scripts that normalize the archive into:

- `inbox_index.json` for fast inbox rendering
- `archive.sqlite` for fast message loading and search

If those files are already present, the app can load immediately. If not, run the relevant build scripts from the project root before expecting the inbox and search views to behave correctly.

## Working with large archives

Large exports can contain hundreds of conversations and hundreds of thousands of messages. The app is designed to avoid loading everything at once:

- inbox data is summarized separately
- chat messages are paged from SQLite
- search is scoped to a single thread and paged
- media-heavy views lazy-load content where possible

## Useful development commands

```bash
npm run dev
npm run build
npm run lint
```

## Recommended development workflow

### Use local development first

Build features and test search, export, and overlays locally before creating hosted packages.

### Keep the archive outside Git

Treat exported personal data as local working data, not repository content.

### Rebuild derived files when source data changes

If you swap inbox folders, rebuild:

- `inbox_index.json`
- `archive.sqlite`

## If the app loads but conversations are missing

Check:

- the archive path is correct
- the inbox folder names match the current export
- the derived JSON and SQLite files were rebuilt after changes

## What to read next

- [Build scripts and setup pipeline](/installation/using-install-script)
- [Viewer usage guide](/instagram-archive-viewer/usage)
