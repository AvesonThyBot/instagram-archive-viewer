# Instagram Archive Viewer

Instagram Archive Viewer is a private-first viewer for exported Instagram DMs. It turns raw archive data into a cleaner inbox, a faster chat experience, and a much better search workflow than digging through JSON manually.

The long-term direction of the project is a **Bring Your Own Data** platform:

- users can run everything locally
- users can export a smaller static version and host it themselves
- users can later connect their own hosted encrypted bundle to `archive.aveson.co.uk`

## Why this project exists

Instagram exports are useful, but the raw format is not pleasant to browse. This project rebuilds the archive into:

- `inbox_index.json` for fast conversation previews
- `archive.sqlite` for fast message loading and search
- an Instagram-inspired UI for inbox, chat, media, favourites, and search overlays

The result is both a recovery tool and a better archive browser.

## The three output tiers

The project is designed around three ways to use it.

| Tier | Format | Best for | Storage model |
| --- | --- | --- | --- |
| Developer | Full source project | contributors and technical users | local or self-hosted |
| Static Export | built app + selected data | users with their own Pages/VPS hosting | user-hosted static deployment |
| Cloud Service | hosted web app | general users | remote object storage + encrypted references |

### 1. Full source project

This is the current contributor workflow.

- run locally
- develop features
- test with your own archive
- build trimmed exports

### 2. Static export

This is the self-hosting workflow.

- choose the conversations you want
- rebuild `inbox_index.json`
- rebuild `archive.sqlite`
- remove unnecessary source files like raw `messages.json`
- host the result on your own infrastructure

### 3. Hosted BYOD platform

This is the future model for `archive.aveson.co.uk`.

The goal is to keep your server costs low and the privacy model strong by storing only what the platform actually needs:

- account data
- metadata
- encrypted bundle references

The platform should **not** store the user's archive contents by default.

## Architecture direction

The current app already uses the right shape for this future:

```text
Instagram export
  -> normalize into inbox_index.json
  -> normalize into archive.sqlite
  -> selective export trims data
  -> static or hosted viewer loads the derived files
```

That keeps runtime simpler and makes it practical to support both self-hosting and hosted access later.

## Recommended storage layer for the hosted platform

For the future BYOD hosted flow, **Cloudflare R2** is the best default recommendation.

### Why R2 fits well

- **Zero egress fees**: important because the frontend will download the archive bundle to the browser.
- **Good fit with Cloudflare Pages**: ideal if the frontend is also hosted on Cloudflare.
- **CORS friendly**: easier to lock requests down to your frontend origin.
- **Low cost**: strong for a privacy-focused side project or early product.

## Security model

The strongest version of this platform is **client-side encrypted BYOD**.

### Recommended flow

1. The user runs a local export script.
2. The script builds a hosted-ready bundle.
3. The script asks for a master password.
4. The bundle is encrypted locally before upload.
5. The user uploads the encrypted bundle to their own object storage.
6. The user gives the hosted app the bundle location.
7. The frontend downloads, decrypts, decompresses, and opens the archive locally in the browser.

### Why this is strong

- you do not need to store their archive data
- your backend does not need to parse or process the archive
- the user's storage provider only sees encrypted blobs
- the browser does the expensive work instead of your server

## What should be stored in the database

For the future hosted platform, the database should contain only:

- account identity
- auth metadata
- encrypted storage pointer or encrypted object key
- timestamps and light bundle metadata

It should not contain:

- raw archive contents
- decrypted permanent archive URLs
- copied DM media libraries by default

## Key handling recommendation

If you want the strongest privacy story, the user should provide the archive password each session and you should not persist it.

If you later decide to persist a storage key or reference, encrypt it at the application layer before writing it to the database. Database-at-rest encryption alone is not enough for this use case.

## Future export script direction

The future export script should produce a single hosted-ready archive bundle, ideally:

```text
archive-bundle.tar.gz
```

The bundle should include:

- `inbox_index.json`
- `archive.sqlite`
- only the selected media files required by the chosen conversations

It should remove:

- raw `messages.json` files after verification
- source-only setup files
- anything not needed at runtime

## Example future export flow

```bash
# 1. Build runtime data
node scripts/buildInboxIndex.js
node scripts/buildMessageDatabase.js

# 2. Stage only runtime files and selected media
# 3. Remove unnecessary raw JSON
# 4. Compress into a hosted bundle
tar -czf archive-bundle.tar.gz export/
```

## Performance note

Because the hosted client will decrypt, decompress, and process the bundle in the browser, large archives can require substantial device memory. A large archive may briefly need far more memory than the final SQLite file size suggests.

That means the product should eventually include:

- a visible loading screen
- decompression progress
- archive hydration progress
- clear messaging on large bundle sizes

## Media access and CORS

If media lives in user-controlled storage, the docs and product should explain how to allow the frontend origin to fetch those files safely.

For example, if the hosted app lives at:

```text
https://archive.aveson.co.uk
```

the storage configuration will usually need to allow that origin for asset fetches.

## Local setup

```bash
git clone https://github.com/avesonthybot/instagram-archive-viewer.git
cd instagram-archive-viewer
npm install
npm run dev
```

## Self-hosting today

The current project already supports building a static app:

```bash
npm run build
```

That output can be deployed to platforms like Cloudflare Pages.

## Documentation

Detailed docs live in [`/docs`](C:/Users/Aveson/Documents/Development/Instagram%20Archive%20Viewer/docs) and now cover:

- local setup
- viewer behavior
- selective export
- self-hosting
- Cloudflare Pages and Zero Trust recommendations
- the future BYOD hosted architecture
- privacy and security reasoning

## Main links

- GitHub: [github.com/avesonthybot](https://github.com/avesonthybot)
- Future hosted app: [archive.aveson.co.uk](https://archive.aveson.co.uk)
