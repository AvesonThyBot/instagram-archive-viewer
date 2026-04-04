---
title: Cloudflare Pages and Zero Trust
sidebar_position: 2
---

# Cloudflare Pages and Zero Trust

Cloudflare Pages is a strong fit for a static export of the viewer because it handles global static delivery well and works cleanly with additional access controls.

## Deploy the static viewer

1. Build the viewer locally with `npm run build`.
2. Upload the `dist` output to a Pages project.
3. Put Cloudflare Access in front of the deployment if the archive is private.

## Choose a deployment method

### Git-connected Pages project

Use this when the exported project lives in its own repository and you want Cloudflare to build on every push.

### Direct upload / Wrangler flow

Use this when you want to upload the static build directly without a Git-integrated production workflow.

Cloudflare Pages overview: [Cloudflare Pages](https://developers.cloudflare.com/pages)

Wrangler configuration guidance: [Cloudflare Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)

## Use these build settings

For a Vite-based static site, the deployment shape is:

- build command: `npm run build`
- output directory: `dist`

## Set up Cloudflare R2 for BYOD bundles

If you want users to connect their own encrypted archive bundles to the hosted app, create an R2 bucket for bundle storage.

### Create the bucket

1. Open the Cloudflare dashboard.
2. Go to `R2 Object Storage`.
3. Create a private bucket.
4. Use a naming structure such as `users/{user-id}/archive-bundle.tar.gz`.

### Upload only encrypted bundles

Do not upload a plain SQLite archive for the hosted flow. The export pipeline should encrypt the bundle before it leaves the user's machine.

### Keep the bucket private

Serve access through controlled URLs or storage keys. Do not expose a permanently public object URL for private archives.

## Configure CORS on R2

If `https://archive.aveson.co.uk` needs to fetch bundles or media directly from R2, allow only the required origin.

### Recommended allowed origins

- `https://archive.aveson.co.uk`

### Recommended methods

- `GET`
- `HEAD`

### Recommended allowed headers

- `Range`
- `Content-Type`

### Recommended exposed headers

- `Content-Length`
- `Content-Range`
- `ETag`

Do not use `*` for origins on private archive storage.

## Protect the viewer with Zero Trust

If the deployment contains private conversations, put Cloudflare Access in front of it.

Use this flow:

1. Create the Pages site.
2. Attach the production domain.
3. Open Cloudflare Zero Trust.
4. Create an Access application for the viewer domain.
5. Allow only the identities or email addresses that should see the site.

## Why this setup works well

- Pages serves the app globally.
- R2 stores large archive bundles without egress pain.
- Zero Trust protects the viewer UI.
- The browser handles decryption and SQLite loading, which keeps backend cost low.

## Learn the Zero Trust side first

Cloudflare Zero Trust docs are the right starting point for the access-control layer. For a short video introduction from Cloudflare's own docs library, see:

- [SASE - Secure remote access to your critical infrastructure](https://developers.cloudflare.com/videos/sase-3-secure-remote-access/)
