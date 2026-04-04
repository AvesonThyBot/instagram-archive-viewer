---
title: Build scripts and setup pipeline
sidebar_position: 3
---

# Build scripts and setup pipeline

The project started with a setup-script style workflow and is now moving toward a cleaner export and hosting pipeline. This page documents both the current approach and the recommended future direction.

## What the current scripts do

Today the build pipeline is responsible for:

- reading all inbox folders
- summarizing threads into `inbox_index.json`
- normalizing message rows into `archive.sqlite`
- preserving enough metadata to power the inbox, search, media tabs, and chat loading

## Derived files

### Inbox summary

`inbox_index.json` stores a lightweight view of each conversation, including:

- display name
- thread id / folder name
- last message preview
- timestamp metadata
- image URI when available

### SQLite database

`archive.sqlite` stores normalized messages so the UI does not need to scan every JSON file for every search or pagination request.

It is the right place for:

- text search
- sender filtering
- attachment type filtering
- loading context above and below a selected message

## Recommended future packaging script

For the hosted platform plan, a plain `.gz` file is not ideal because you want to ship multiple files together. The better format is:

```text
archive-bundle.tar.gz
```

That bundle should contain at minimum:

- `inbox_index.json`
- `archive.sqlite`
- any referenced media folders required by the chosen conversations

## Proposed future shell script

The future shell script should:

1. ask which inbox folders to include
2. copy only those thread folders into a staging directory
3. rebuild `inbox_index.json`
4. rebuild `archive.sqlite`
5. delete leftover `messages.json` source files if the hosted package does not need them
6. compress the result into a `.tar.gz`
7. print upload instructions for the user

## Why `.tar.gz` is the better recommendation

- one file to upload
- gzip compression on both SQLite and JSON
- works well on Linux and macOS directly
- easy to produce on Windows with common tooling too

## What the hosted platform should expect later

In the future, the hosted app can accept a user-provided bundle URL rather than raw uploaded archive contents. That keeps the main platform lighter and avoids storing the user's DM data on your own infrastructure.

## Recommended rule for hosted bundles

The bundle should contain only derived data and required media. It should not need:

- original setup scripts
- development-only files
- root repository metadata
- source `messages.json` files once the SQLite database is built and verified

## Keep the pipeline simple

If a file is not required for runtime, remove it from the hosted package. Smaller bundles are faster to host, faster to cache, and easier to reason about.
