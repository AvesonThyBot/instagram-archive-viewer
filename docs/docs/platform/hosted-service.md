---
title: Hosted service plan
sidebar_position: 1
---

# Hosted service plan

This page documents the future product direction for `archive.aveson.co.uk`.

## Goal

Let users experience the viewer as a hosted product without forcing you to centrally store their DM archives.

## Product position

This is a **Bring Your Own Data** platform, not a traditional upload-and-store SaaS.

That distinction matters because it affects:

- infrastructure cost
- legal exposure
- privacy guarantees
- user trust

The strongest version of the product lets the user keep ownership of the archive bundle while the hosted app provides the interface, account layer, and decryption workflow.

## Recommended product model

The hosted service should manage:

- accounts
- permissions
- metadata
- bundle references
- UI state

The hosted service should avoid storing:

- raw message archives
- full DM media sets
- long-term copies of user-uploaded archive bundles unless absolutely required

## The three output tiers

The project now naturally splits into three products:

| Tier | Format | Best for | Storage model |
| --- | --- | --- | --- |
| Developer | full source repository | contributors and technical users | local / self-hosted |
| Static Export | compiled static app | users with their own hosting | bundled `archive.sqlite` + media |
| Cloud Service | `archive.aveson.co.uk` | general users | remote object storage + encrypted references |

This is a strong structure because each tier serves a different user without forcing one deployment model onto everyone.

## Suggested hosted flow

1. The user creates an account.
2. The user generates a hosted-ready archive bundle locally.
3. The user uploads that bundle to storage they control or trust.
4. The user provides the hosted app with the bundle URL or storage descriptor.
5. The app validates, fetches, and uses the bundle for viewing.

## Why this approach is worth it

### Lower cost

The backend does not need to ingest, parse, index, and permanently store every user's archive.

### Better privacy

The product can genuinely say it does not keep the archive data itself by default.

### Better scalability

The browser handles decryption, decompression, and SQLite access, so the server mostly acts as an identity and metadata layer.

### Cleaner liability boundary

You are hosting the product experience, not warehousing the user's private conversations.

## Why this model is strong

- lower privacy risk
- lower storage liability
- smaller backend responsibilities
- easier legal and trust positioning

## Authentication recommendation

Supabase is a reasonable fit for:

- email/password
- magic links
- OAuth providers
- user/session management

Supabase Auth documentation: [Supabase reference docs](https://supabase.com/docs/reference)

Supabase is a good fit for this role because it is strongest at auth, user records, and metadata, which is exactly what the hosted platform should retain.

## What should live in Supabase

- user id
- profile metadata
- bundle descriptor metadata
- encrypted bundle reference
- audit timestamps

## What should not live in Supabase by default

- the actual archive bundle contents
- uploaded DM media
- decrypted permanent archive URLs

## Recommended storage service

For the hosted BYOD flow, Cloudflare R2 is the best default storage recommendation.

### Why R2 is the right fit

- **Zero egress fees**: the frontend will repeatedly download archive bundles and media, so avoiding egress costs matters.
- **Good Pages alignment**: if the app is hosted on Cloudflare Pages, the platform stays operationally simple.
- **CORS control**: it is straightforward to allow only the hosted frontend origin.
- **Good early-stage economics**: it fits a privacy-first product without immediately turning storage into the main cost center.

## Execution model in the browser

The intended hosted flow is:

1. download the encrypted archive bundle
2. decrypt it in the browser
3. decompress it in the browser
4. hand the SQLite payload to the viewer runtime

That keeps the heavy lifting on the client and keeps your server role intentionally small.

## Public trial route

You can still host a public demo at `archive.aveson.co.uk` that lets people explore the interface without loading private user data. That gives users a low-friction preview before they decide whether to self-host or attach their own bundle.
