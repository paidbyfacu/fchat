# Changelog

All notable changes to FChat. Installations with automatic updates get each version through the **Update FChat** workflow; the version you run is in **Settings › Updates**.

## 1.1.1 · 2026-11-27

### Fixed

- **A post's own automation now beats a global one.** If an automation for any post and an automation for a specific post used the same keyword, the global one could answer on that post instead of the post's own flow. Now, when a comment fires both, only the post's automation runs, so the person gets a single DM. This also applies to the automation for the next post once its post is assigned.
- Comments on that post that only match the global automation's keywords, or that hit one of the post automation's blocking words, still get the global flow. Posts without their own automation work as before.
- A paused, stopped or unpublished post automation never blocks the global one.
- Priority uses exactly the same keyword comparison as firing: case, accents, punctuation and extra spaces are ignored, and keywords match whole words inside the comment.

### Changed

- When you publish an automation that overlaps with another one, the notice now says which one will answer on which posts.
- The README explains how automations that could answer the same comment are combined.

### Priority order

When several active automations could answer the same comment, only the first one runs:

1. An automation for specific posts or for the next post, over one for any post.
2. An automation with keywords, over one for any comment.
3. The oldest one.

## 1.1.0 · 2026-11-23

- Dashboard in English and Spanish, with a language selector in Settings.

## 1.0.4 · 2026-11-23

- Public repository in English, with brand, contribution guide and terms.

## 1.0.0 · 2026-11-22

- First public version: inbox, top menu, guided installation and automatic updates.
