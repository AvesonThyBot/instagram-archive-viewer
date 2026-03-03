---
sidebar_position: 2
---

# Using the `install.sh` Script

The repository includes a helper shell script that simplifies copying and formatting your
Instagram export data into the viewer's expected directory structure.

```bash
# from the workspace root
chmod +x install.sh
./install.sh /path/to/instagram/export /path/to/instagram-archive-viewer
```

The script handles:

- locating the `messages` directory inside the archive
- converting `.json` files to a single merged file
- moving media assets if present

## Debugging & Troubleshooting

> _(record issues you encounter while running the script and how you fixed them)_

- **Permission denied** – ensure the script is executable (`chmod +x`).
- **Wrong directory error** – verify both paths point to existing folders and that the export
  contains a `messages` folder.
