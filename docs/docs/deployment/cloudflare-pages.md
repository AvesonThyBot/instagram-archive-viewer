---
title: Cloudflare Pages and Zero Trust
sidebar_position: 2
---

# Cloudflare Pages and Zero Trust

Cloudflare Pages is a strong fit for a static export of the viewer because it handles global static delivery well and works cleanly with additional access controls.

## Recommended deployment path

1. Build the viewer locally with `npm run build`.
2. Upload the `dist` output to a Pages project.
3. Put Cloudflare Access in front of the deployment if the archive is private.

## Two ways to deploy

### Git-connected Pages project

Best when the exported project lives in its own repository.

### Direct upload / Wrangler flow

Best when you want to upload the static build directly without a Git-integrated production workflow.

Cloudflare Pages overview: [Cloudflare Pages](https://developers.cloudflare.com/pages)

Wrangler configuration guidance: [Cloudflare Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)

## Basic build settings

For a Vite-based static site, the deployment shape is usually:

- build command: `npm run build`
- output directory: `dist`

## Zero Trust recommendation

If the content is personal, do not rely on obscurity alone.

The recommended access model is:

- keep the site private behind Cloudflare Access
- allow only authenticated emails or identities you trust
- use short-lived sessions and audit access centrally

Cloudflare Zero Trust docs are the right starting point for this control layer. For a short video introduction from Cloudflare's own docs library, see:

- [SASE - Secure remote access to your critical infrastructure](https://developers.cloudflare.com/videos/sase-3-secure-remote-access/)

## Practical recommendation for this project

For a personal archive deployment:

1. host the static viewer on Pages
2. restrict it with Cloudflare Access
3. keep the archive bundle itself in the deployment or in a protected object store

That gives you a simpler model than building a full custom auth layer immediately.
