---
title: Viewer usage
sidebar_position: 1
---

# Viewer usage

This page explains how the current app behaves once your archive is loaded.

## Inbox

The inbox is driven by `inbox_index.json`, not by full thread scans on every render.

That means the inbox can:

- sort by most recent activity
- show lightweight previews quickly
- remain responsive even when the archive is large

## Chat loading

The chat view uses SQLite-backed pagination instead of loading every message at once.

The current behavior is designed around:

- initial message windows
- loading older context on scroll
- loading focused context around search hits
- keeping the visible message stable while more messages are inserted

## Search

Search is scoped to a single conversation and supports:

- free text
- URLs
- `from:`
- `has:`
- `before:`
- `after:`
- time-style filters such as `time:today`

The search overlay shows total matches and paged results so large threads stay usable.

## Media

The chat and settings overlays can expose:

- photos
- videos
- audio
- reels
- files
- links

Media is intentionally displayed differently from plain text messages so the conversation is easier to scan.

## Favourites

Favourite messages are stored per thread and can be revisited through the favourites overlay even if the message is not currently loaded in the live chat window.

## Themes and perspective

Themes change the chat feel without changing the actual archive data.

Perspective switching is a viewing tool. It should affect how the thread is interpreted in the UI, but it should not rewrite the real conversation identity.

## Export from the viewer

The export overlay lets the user choose exactly which conversations to package. The exported copy should then rebuild only the data needed for those selected threads.

## Local avatar overrides

Some direct-message exports do not include a usable profile picture. The local profile-picture manager fills that gap by letting the user upload a replacement image stored inside the project assets.

## What the viewer is optimised for

- browsing archive history comfortably
- searching large threads quickly
- creating smaller hosted copies
- keeping runtime fast without keeping the original raw archive open all the time
