---
title: Hosted service plan
sidebar_position: 1
---

# Hosted service plan

Run `archive.aveson.co.uk` as a Bring Your Own Data platform, not as a traditional upload-and-store SaaS.

## Product position

This distinction matters because it improves:

- infrastructure cost
- legal exposure
- privacy guarantees
- user trust

The strongest version of the product lets the user keep ownership of the archive bundle while the hosted app provides the interface, account layer, and decryption workflow.

## Operate the service like this

The hosted service manages:

- accounts
- permissions
- metadata
- bundle references
- UI state

The hosted service avoids storing:

- raw message archives
- full DM media sets
- long-term copies of user-uploaded archive bundles

## Structure the product in three tiers

| Tier | Format | Best for | Storage model |
| --- | --- | --- | --- |
| Developer | Full source repository | contributors and technical users | local / self-hosted |
| Static Export | compiled static app | users with their own hosting | bundled `archive.sqlite` + media |
| Cloud Service | `archive.aveson.co.uk` | general users | remote object storage + encrypted references |

This structure works because each tier serves a different user without forcing one deployment model onto everyone.

## Use this account and archive flow

1. The user creates an account.
2. The user generates a hosted-ready archive bundle locally.
3. The user uploads that encrypted bundle to storage they control or trust.
4. The user links the bundle URL or storage descriptor inside the account.
5. The hosted app validates, fetches, and opens the archive for viewing.

## Why this approach is worth it

### Lower cost

The backend does not ingest, parse, index, and permanently store every user's archive.

### Better privacy

The product can honestly say it does not keep the archive data itself by default.

### Better scalability

The browser handles decryption, decompression, and SQLite access, so the server mostly acts as an identity and metadata layer.

### Cleaner liability boundary

You host the product experience, not a warehouse of private conversations.

## Use Supabase for the account layer

Use Supabase for:

- email and password accounts
- magic links
- OAuth providers
- session handling
- user metadata

Supabase Auth documentation: [Supabase reference docs](https://supabase.com/docs/reference)

Supabase fits this role well because it is strongest at auth, user records, and metadata, which is exactly what the hosted platform should retain.

## Store only this in Supabase

- user id
- profile metadata
- encrypted bundle reference
- light bundle metadata
- audit timestamps

## Do not store this in Supabase by default

- the archive bundle itself
- uploaded DM media
- decrypted permanent archive URLs

## Use Cloudflare R2 as the storage default

Cloudflare R2 is the best default storage recommendation for this platform.

### Why R2 is the right fit

- **Zero egress fees**: the frontend repeatedly downloads bundles and media.
- **Good Pages alignment**: the stack stays simple if the frontend is on Cloudflare.
- **CORS control**: you can allow only the hosted frontend origin.
- **Good early-stage economics**: it keeps storage from becoming the main cost center.

## Let the browser do the heavy lifting

In production, the browser should:

1. Download the encrypted archive bundle.
2. Decrypt it locally.
3. Decompress it locally.
4. Hand the SQLite payload to the viewer runtime.

That keeps the expensive work on the client and keeps the server role intentionally small.

## Run a public demo separately

Run a public demo at `archive.aveson.co.uk` that lets people explore the interface without loading private user data. That gives users a low-friction preview before they decide whether to self-host or attach their own bundle.
