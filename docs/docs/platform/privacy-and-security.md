---
title: Privacy and security model
sidebar_position: 2
---

# Privacy and security model

If the future hosted product is going to work with personal archives, the privacy model needs to be explicit.

## Recommended privacy position

The platform should not store user archive contents by default.

Instead, it should store only:

- account identity
- authorization state
- a reference to where the user's archive bundle lives

This is the core reason the model is strong on both privacy and cost. Storing pointers instead of archive contents means:

- significantly lower backend storage cost
- lower data breach impact
- lower compliance and liability pressure
- a clearer trust story for users

## Should the bundle URL be encrypted?

Yes, if you persist it.

## Best recommendation

Use **application-layer encryption** before writing the bundle reference to the database.

That means:

1. the application encrypts the storage reference with a server-side key
2. the encrypted blob is stored in the database
3. the app decrypts it only when needed for an authorized request

## Ideal key model

The strongest privacy model is:

- the user enters the archive password when they need it
- the password is not stored permanently by the platform
- the browser uses it to decrypt the bundle locally

If you later add convenience features that require persisting something, store an encrypted pointer or encrypted object key, not a plain reusable secret.

## Why application-layer encryption is better here

Database-at-rest encryption is useful, but it is not enough for this use case. If your app stores a sensitive URL plainly in a table, anyone with sufficiently broad application or database access can still read it.

Application-layer encryption protects the value even if someone can inspect the table contents directly.

## Practical design recommendation

- use AES-GCM for envelope-style encryption
- keep the master key outside the database
- store the key in environment secrets or a managed key system
- store nonce, version, and ciphertext in the metadata row

If you want a memorable product promise, this is the right one:

> the archive is encrypted before upload, and the hosted platform only keeps the minimum metadata needed to help the user reconnect to it

## Suggested storage model

Best:

- private object storage
- short-lived signed URL generation
- encrypted reference to the storage object key, not a permanently public URL

Acceptable:

- encrypted stored URL to a private bundle location

Avoid:

- public forever links to sensitive archive bundles

## Browser resource warning

Client-side decryption and SQLite hydration are great for privacy and cost, but they do move memory pressure to the user's device.

That means the product should clearly communicate:

- archive size
- estimated loading time
- visible progress while downloading and decompressing
- that very large archives may use a lot of browser memory

This is not a flaw in the model, but it does need to be surfaced honestly in the UX.

## Where Supabase fits

Supabase is a strong fit for auth and metadata, but treat it as the control plane, not the archive warehouse.

## User trust statement this model supports

You can honestly say:

> We do not store your archive contents on our platform. We only store the minimum account metadata needed to help you reconnect to your own hosted bundle, and that reference is encrypted before it is written to the database.

That is a much stronger story than saying you store everything but keep it private.
