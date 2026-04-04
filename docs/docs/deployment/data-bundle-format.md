---
title: Future archive bundle format
sidebar_position: 3
---

# Future archive bundle format

The future hosted workflow should revolve around a single generated archive bundle.

This bundle is the bridge between the local viewer and the future hosted BYOD platform.

## Recommended file format

Use:

```text
archive-bundle.tar.gz
```

instead of a plain `.gz` file.

A plain gzip stream is not ideal for packaging multiple runtime files together. A `tar.gz` keeps the bundle structured.

If the actual implementation later chooses `.zip` for better native Windows familiarity, that is still workable. The important architectural rule is that the bundle is:

- a single portable artifact
- encrypted before upload when used for hosted access
- built from derived runtime files, not raw source archive clutter

## Bundle contents

The recommended contents are:

- `messages/inbox_index.json`
- `messages/archive.sqlite`
- only required media folders for the selected threads
- optional metadata manifest such as build version and creation time

## What should be removed before packaging

To keep the hosted bundle lean, the export step should remove:

- raw `messages.json` files once SQLite has been rebuilt and verified
- development scripts
- local-only setup helpers
- repository metadata that does not matter at runtime

## Optional manifest file

A small `bundle.json` manifest can be helpful for validation:

```json
{
  "version": 1,
  "createdAt": "2026-04-04T12:00:00Z",
  "conversationCount": 18,
  "hasSQLite": true
}
```

## Why this bundle matters

The hosted platform can then ask the user for a URL to the bundle instead of the raw archive itself.

That makes the hosted product:

- lighter to operate
- easier to cache
- easier to validate
- less intrusive from a privacy point of view

It also creates a clean contract between the local build tool and the hosted viewer. That is important because it means the hosted platform can stay simple while the export logic evolves separately.

## Storage recommendation

Use object storage that can serve the bundle reliably and cheaply. Cloudflare R2 is a strong option because it pairs naturally with Cloudflare-hosted frontend infrastructure and avoids painful egress pricing patterns.

That matters here because the browser will be the one downloading the archive bundle, and repeated bandwidth charges would quickly make the hosted tier more expensive than it needs to be.

## Best practice for access

Prefer:

- private objects
- short-lived signed URLs

Avoid:

- permanently public bundle URLs for sensitive data

## Suggested export script responsibilities

The future export script should do the heavy lifting so the user does not have to manually assemble a deployment package.

It should:

1. rebuild `inbox_index.json`
2. rebuild `archive.sqlite`
3. gather selected media into the export area
4. remove unneeded raw source files
5. compress the runtime package
6. encrypt it before upload when the user is preparing a hosted-cloud workflow

That keeps the hosted side lightweight and reduces user error.
