---
title: Download your Instagram data
sidebar_position: 1
---

# Download your Instagram data

The viewer works best with the official Instagram export in **JSON** format.

## What to request from Instagram

When you request your archive from Instagram:

- choose **JSON**
- include **messages**
- keep the archive complete instead of trimming it if you want full search coverage later

## Why JSON matters

The app and scripts are built around Instagram's exported JSON structure:

- inbox folders
- `messages.json` files
- per-thread media references
- participant metadata and timestamps

HTML exports are much harder to normalize and are not the preferred path for this project.

## Expected folder shape

After extracting the archive, the part that matters most usually looks similar to this:

```text
your_instagram_activity/
  messages/
    inbox/
      examplethread_123456789/
        messages.json
        photos/
        videos/
        audio/
```

The viewer build scripts read the inbox folders, summarize each conversation into `inbox_index.json`, and then write a SQLite database for fast loading and search.

## Where to place the archive locally

For the current local workflow, the app expects the archive data under:

```text
instagram-archive-viewer/public/data/your_instagram_activity/messages/inbox
```

If you are using the project scripts, they will read from that path and create:

- `public/data/your_instagram_activity/messages/inbox_index.json`
- `public/data/your_instagram_activity/messages/archive.sqlite`

## Recommended preparation steps

1. Download the archive from Instagram.
2. Extract it somewhere outside the app first so you can verify the folder structure.
3. Copy only the `your_instagram_activity` directory into the app's `public/data` area.
4. Keep the original untouched archive as your backup.

## Common mistakes

### Using the wrong export format

If the export is HTML instead of JSON, the current pipeline will not give you the same clean results.

### Copying the wrong folder depth

Do not nest the archive one level too deep. The app should see:

```text
public/data/your_instagram_activity/messages/inbox
```

not:

```text
public/data/some-random-folder/your_instagram_activity/messages/inbox
```

### Missing media

If photos, videos, or audio files are missing from the archive folder, the viewer can still show the message records, but media previews will be incomplete.

## What happens next

Once the archive is in place, move on to [running the project locally](/installation/running-project).
