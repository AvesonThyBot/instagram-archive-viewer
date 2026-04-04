---
title: Self-hosting
sidebar_position: 1
---

# Self-hosting

The simplest deployment model is still a self-hosted static app.

## Best use case

Use self-hosting when:

- you want complete control over the archive
- you do not want account infrastructure yet
- you are deploying a personal copy or a very small trusted audience copy

## Local build flow

Inside `instagram-archive-viewer`:

```bash
npm install
npm run build
```

The output is the standard Vite `dist` folder.

## What should be inside a good self-hosted package

- built frontend files
- trimmed `public/data` contents for selected conversations
- rebuilt `inbox_index.json`
- rebuilt `archive.sqlite`
- only the media files that the selected conversations need
- any local uploaded profile images that are still referenced

## What should not be inside the hosted package

- raw `messages.json` files after SQLite has been rebuilt and verified
- development-only scripts that are not needed at runtime
- repository housekeeping files that only make sense in source control

## Deployment targets that work well

- Cloudflare Pages
- Netlify
- static Nginx hosting
- private LAN hosting

## Security recommendation

If the hosted copy contains private conversations, do not leave it openly public by default. Put access control in front of it.

For Cloudflare, the strongest recommendation is:

- Cloudflare Tunnel where needed
- Cloudflare Access / Zero Trust in front of the app

See [Cloudflare Pages deployment](/deployment/cloudflare-pages) for concrete steps.
