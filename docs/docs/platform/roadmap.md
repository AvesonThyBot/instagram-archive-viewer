---
title: Product roadmap
sidebar_position: 3
---

# Product roadmap

This roadmap focuses on the highest-value next steps for turning the project into a durable product.

## Phase 1: polish the local viewer

- finish export trimming cleanly
- ensure runtime no longer depends on raw `messages.json` files
- strengthen search and media browsing
- improve mobile overlays and performance

## Phase 2: formalize archive bundles

- ship a dedicated shell script that creates a `.tar.gz` bundle
- include validation and integrity checks
- document supported storage targets

## Phase 3: release self-hosting documentation

- one-command build instructions
- Cloudflare Pages deployment guide
- Zero Trust protection guide
- sample `wrangler` configuration for a static deployment workflow

## Phase 4: launch hosted preview

- public product preview at `archive.aveson.co.uk`
- no user archive storage
- optional account system for saved preferences and bundle references

## Phase 5: add account-backed archive access

- Supabase Auth for login
- encrypted bundle references
- storage validation flow
- signed access handoff to the viewer

## Phase 6: collaboration and premium ideas

Possible later features:

- device sync for settings
- optional wrapped / yearly summaries
- richer export presets
- shareable safe views for non-sensitive subsets

Only build these after the privacy and deployment model is stable.
