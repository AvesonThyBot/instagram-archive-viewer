---
title: Privacy and security model
sidebar_position: 2
---

# Privacy and security model

If the hosted product works with personal archives, the privacy model needs to be explicit.

## Store pointers, not archives

The platform should not store user archive contents by default.

Store only:

- account identity
- authorization state
- a reference to where the user's archive bundle lives

This model is strong on both privacy and cost. Storing pointers instead of archive contents means:

- significantly lower backend storage cost
- lower data breach impact
- lower compliance pressure
- a clearer trust story for users

## Encrypt the bundle reference

If you persist the bundle URL or object key, encrypt it.

## Use application-layer encryption

Use **application-layer encryption** before writing the bundle reference to the database.

That means:

1. The application encrypts the storage reference with a server-side key.
2. The encrypted blob is stored in the database.
3. The app decrypts it only when needed for an authorized request.

## Use this key model

The strongest privacy model is:

- the user enters the archive password when needed
- the password is not stored permanently by the platform
- the browser uses it to decrypt the bundle locally

If you add convenience features that require persisting something, store an encrypted pointer or encrypted object key, not a plain reusable secret.

## Why application-layer encryption is better

Database-at-rest encryption is useful, but it is not enough for this use case. If the app stores a sensitive URL plainly in a table, anyone with sufficiently broad application or database access can still read it.

Application-layer encryption protects the value even if someone can inspect the table contents directly.

## Practical encryption guidance

- use AES-GCM for envelope-style encryption
- keep the master key outside the database
- store the key in environment secrets or a managed key system
- store nonce, version, and ciphertext in the metadata row

Use this as the product promise:

> The archive is encrypted before upload, and the hosted platform keeps only the minimum metadata needed to reconnect the user to it.

## Use private object storage

Best:

- private object storage
- short-lived signed URL generation
- encrypted reference to the storage object key, not a permanently public URL

Acceptable:

- encrypted stored URL to a private bundle location

Avoid:

- public forever links to sensitive archive bundles

## Warn users about browser memory

Client-side decryption and SQLite hydration are great for privacy and cost, but they move memory pressure to the user's device.

Communicate:

- archive size
- estimated loading time
- visible progress while downloading and decompressing
- that very large archives may use a lot of browser memory

This is not a flaw in the model, but you do need to surface it honestly in the UX.

## Keep Supabase in the control plane

Supabase is a strong fit for auth and metadata, but treat it as the control plane, not the archive warehouse.

## Use the stronger trust statement

You can honestly say:

> We do not store your archive contents on our platform. We store only the minimum account metadata needed to reconnect you to your own hosted bundle, and that reference is encrypted before it is written to the database.
