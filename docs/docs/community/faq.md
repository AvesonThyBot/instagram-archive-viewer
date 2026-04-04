---
title: FAQ
sidebar_position: 1
---

# FAQ

## Does the app restore messages back into Instagram?

No. It is a viewer for exported archive data.

## Does the app need my original JSON files at runtime forever?

Not necessarily. A well-prepared export can rebuild SQLite and the inbox index, then remove source `messages.json` files if nothing at runtime depends on them.

## Why use SQLite instead of searching raw JSON?

Because large archives become slow and awkward if every search has to scan hundreds of files repeatedly.

## Can I host just a few conversations?

Yes. That is one of the main reasons the selective export flow exists.

## Will the hosted platform store user DMs?

The recommended future model is **no**. The platform should store account metadata and, if the user opts in, a reference to their own hosted archive bundle rather than the archive contents themselves.

## If a user provides a bundle URL, should it be public?

Prefer a private object store plus short-lived signed access over a permanently public URL.

## Is database encryption enough?

Not on its own. Full-disk or database-level encryption protects infrastructure, but if your app can read the value plainly then operators with enough access can too. For sensitive bundle references, use application-layer encryption before writing them to the database.
