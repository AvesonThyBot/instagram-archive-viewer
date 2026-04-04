---
sidebar_position: 1
title: Overview
---

# Instagram Archive Viewer

Instagram Archive Viewer is a private-first way to explore an exported Instagram DM archive with a UI that feels closer to the live app than a raw folder of JSON files ever will.

The current project already supports:

- an Instagram-inspired inbox and chat layout
- SQLite-backed message loading and search
- selective export of chosen conversations
- media browsing, favourites, themes, and perspective switching
- local profile-picture overrides for missing direct-message avatars

This docs site covers two things at once:

1. how to use and ship the project as it exists today
2. how to design the future hosted platform responsibly

## The project in one sentence

You start with an Instagram export, normalize it into a searchable local dataset, and then browse it through a faster, more focused interface.

## Current architecture at a glance

```text
Instagram export
  -> inbox folders + messages.json
  -> build scripts create inbox_index.json
  -> build scripts create archive.sqlite
  -> Vite app loads inbox + SQLite
  -> user browses, searches, exports, and customizes locally
```

## What the docs are organised around

### Installation

Use this section when you need to get from a raw Instagram download to a working local app.

### Viewer Guide

Use this section when you want to understand how the inbox, message loading, search, overlays, export, themes, and settings behave.

### Deployment

Use this section when you want to host a static copy yourself, prepare a trimmed export, or plan the future `.tar.gz` style bundle flow.

### Hosted Platform

Use this section for the product roadmap around `archive.aveson.co.uk`, account systems, Supabase metadata, encrypted storage links, and privacy boundaries.

## Recommended ways to use the project

### Option 1: Fully local

Best for personal use, privacy, and fast iteration while building the product.

### Option 2: Export a smaller hosted copy

Best when someone only wants a few conversations in a shareable or personal hosted build.

### Option 3: Future hosted platform

Best when you want sign-in, a polished product flow, and a user-owned storage model without storing archive contents on your own infrastructure.

## Design principles behind the project

- **Local first**: the archive should work without needing a remote database.
- **Selective export**: the user should only ship the conversations they choose.
- **Readable at scale**: message search and loading should stay responsive on large archives.
- **Privacy over convenience**: the safest design stores less, not more.
- **Host-agnostic data**: the app can point at a bundle hosted somewhere else later.

## Read this next

- [Download your Instagram data](/installation/downloading-data)
- [Run the project locally](/installation/running-project)
- [Viewer usage guide](/instagram-archive-viewer/usage)
- [Self-hosting guide](/deployment/self-hosting)
- [Hosted platform plan](/platform/hosted-service)
