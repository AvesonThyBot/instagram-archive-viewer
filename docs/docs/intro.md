---
sidebar_position: 1
---

# Welcome to Instagram Archive Viewer Docs

This documentation accompanies the **Instagram Archive Viewer** project – a lightweight web
interface for exploring exported Instagram chat history in a readable, searchable format.

### Why this exists

Instagram provides no built‑in way to restore or analyse old conversations once they have been
deleted. This tool lets you work from an official JSON export, giving you full local control over
your data and a speedy search experience that mimics the native app.

The viewer was originally created to recover lost chats after an account was wiped, but it has
since evolved into a general‑purpose archive browser with features such as perspective toggling,
message grouping, and media previews.

Here you'll find guides on how to prepare your data, import archives, and customize the viewer
for your needs. The docs are organized into folders; use the dropdown in the navbar (now labeled
"Docs") to navigate between sections.

## Getting started

1. Request your Instagram data export as **JSON** (messages only).
2. Place the download in the `public/data` folder or run the `install.sh` helper script.
3. Launch the application:

   ```bash
   cd instagram-archive-viewer
   npm install     # first run
   npm run dev
   ```

   Open the URL shown in your terminal (typically `http://localhost:5173`).

## Need help?

- The **Installation** section in the sidebar covers downloading data, using the script, and
  launching the project.
- If you encounter problems, the **Troubleshooting** page under the “Instagram Archive Viewer”
  category will walk you through common fixes.
- For contributors or developers, check the **Community** folder for guidelines, FAQs, and notes.
  Note that the **Community** category now lives at the top level of the sidebar rather
  than under the Instagram Archive Viewer section; it contains contribution instructions,
  a FAQ, and dev notes.

## Tips & best practices

- Your data never leaves your computer – everything runs locally in the browser.
- Style adjustments belong in `src/css/custom.css`; the minimal theme keeps only necessary
  elements so your custom CSS has priority.
- Organize future docs using subfolders; the sidebar will auto‑generate a dropdown list.

---

_Start by selecting a section from the sidebar above, or review the “Installation” guide to get
up and running._
