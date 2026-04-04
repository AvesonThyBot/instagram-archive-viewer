---
title: Troubleshooting
sidebar_position: 3
---

# Troubleshooting

## The inbox is empty

Check that:

- the archive is in the expected `public/data` location
- `inbox_index.json` was rebuilt
- the selected export is not intentionally trimmed to a smaller subset

## Search returns nothing

Check that:

- `archive.sqlite` exists
- the search is being run inside the correct thread
- the message type filter is not excluding the content you want

## Media does not open

Check that:

- the referenced media file actually exists in the archive
- the exported package included required media folders
- you are not relying on source `messages.json` files after removing them from a trimmed package

## A direct message has no profile picture

That is common in Instagram exports. Use the local profile-picture manager to provide a replacement image for the thread.

## The exported app is larger than expected

Make sure the export only contains:

- selected thread folders
- rebuilt `inbox_index.json`
- rebuilt `archive.sqlite`
- required media assets

Remove:

- raw source files that are no longer required
- unused conversations
- setup scripts that are not needed in the hosted package

## The hosted package works locally but not on the internet

Check:

- static asset paths
- whether the host serves SQLite and media files correctly
- whether your Cloudflare or CDN rules are blocking required asset types

## The future hosted platform stores too much

That is a product-design problem, not just a code problem. The safest rule is:

> store metadata and user-managed links, not the archive contents themselves

See [privacy and security](/platform/privacy-and-security) for the recommended model.
