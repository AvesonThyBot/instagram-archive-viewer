---
title: Configuration
sidebar_position: 2
---

# Configuration

The viewer is still a code-first project, so most configuration is done through project files and build outputs rather than a polished admin panel.

## Data files

The most important runtime data files are:

- `public/data/your_instagram_activity/messages/inbox_index.json`
- `public/data/your_instagram_activity/messages/archive.sqlite`

If either of these becomes out of sync with the source inbox folders, the UI can become misleading.

## Assets

Local avatar overrides are stored under:

```text
public/assets/upload
```

These are runtime assets and should be included in trimmed exports if they are referenced by the inbox index.

## Theme behavior

Themes are a presentation layer. Keep the defaults readable first and dramatic second, especially on mobile where contrast problems show up faster.

## Search behavior

Thread search is intentionally local to the current conversation. This keeps queries simpler and easier to reason about while the app matures.

## Export behavior

A good export should:

- include only selected conversations
- rebuild the inbox index for the exported subset
- rebuild SQLite for that subset
- remove raw `messages.json` files when they are no longer needed at runtime

## Recommended future configuration split

As the hosted platform grows, keep configuration divided into:

### Local viewer config

Things that only matter for a self-hosted or offline copy.

### Hosted platform config

Things that only matter for account systems, storage URLs, encryption, and link access.

### Deployment config

Things that only matter for Cloudflare Pages, Wrangler, Zero Trust, or storage backends.
