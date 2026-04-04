---
title: Developer notes
sidebar_position: 2
---

# Developer notes

## Product split

There are effectively three products to document and maintain:

1. the local viewer for development and private personal use
2. the selective export flow for self-hosted copies
3. the future hosted platform at `archive.aveson.co.uk`

Keeping those concerns separate will make the codebase easier to evolve.

## Recommended long-term data contract

The runtime app should depend on a compact contract:

- `inbox_index.json`
- `archive.sqlite`
- referenced media assets

Everything else is build-time input.

## Why this matters

If the runtime depends on raw `messages.json` files after export, the hosted package stays larger than necessary and more fragile.

## Suggested future services split

### Build service

Takes a local export and creates a trimmed `.tar.gz` bundle.

### Storage layer

User-controlled object storage or a private bucket where the bundle lives.

### Hosted app

Loads the bundle by URL after the user signs in and authorizes access.

### Metadata service

Stores account data and encrypted bundle references, but not the archive content itself.

## Supabase recommendation

Supabase is a good fit for:

- auth
- user profiles
- metadata tables
- row-level security

Supabase should not be treated as the storage location for raw DM bundles if your privacy goal is to avoid holding archive data centrally.
