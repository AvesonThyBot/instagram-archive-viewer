#!/bin/bash

# --- Instagram Archive Viewer Installer ---
# Usage: ./install.sh {path/to/export/folder} {path/to/archive-viewer/folder}

# Assign arguments to variables
EXPORT_PATH=$1
VIEWER_PATH=$2

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "------------------------------------------"
echo "Instagram Archive Viewer: Data Importer"
echo "------------------------------------------"

# 1. Check if both arguments are provided
if [ -z "$EXPORT_PATH" ] || [ -z "$VIEWER_PATH" ]; then
    echo -e "${RED}Error: Missing arguments.${NC}"
    echo "Usage: ./install.sh <export_path> <repo_path>"
    exit 1
fi

# 2. Path Validation
if [ ! -d "$EXPORT_PATH" ]; then
    echo -e "${RED}Error: Export folder not found at: $EXPORT_PATH${NC}"
    echo "Please move the folder to be in the same directory as the cloned repo and try again."
    exit 1
fi

if [ ! -d "$VIEWER_PATH" ]; then
    echo -e "${RED}Error: Viewer folder not found at: $VIEWER_PATH${NC}"
    echo "Please ensure the path to your archive-viewer project is correct."
    exit 1
fi

# Convert to absolute paths
ABS_EXPORT_PATH=$(cd "$(dirname "$EXPORT_PATH")" && pwd)/$(basename "$EXPORT_PATH")
ABS_VIEWER_PATH=$(cd "$(dirname "$VIEWER_PATH")" && pwd)/$(basename "$VIEWER_PATH")

echo -e "${GREEN}Valid Paths Confirmed:${NC}"
echo "Source: $ABS_EXPORT_PATH"
echo "Target: $ABS_VIEWER_PATH"
echo "------------------------------------------"

# 3. Ask user for Copy or Cut
echo -e "${YELLOW}Media Handling:${NC}"
echo "1) Copy files (Keep original export intact)"
echo "2) Cut/Move files (Save disk space, deletes from source)"
read -p "Select an option [1-2]: " ACTION_CHOICE

# 4. Define Internal Paths
INBOX_PATH="$ABS_EXPORT_PATH/your_instagram_activity/messages/inbox"
TARGET_DATA_DIR="$ABS_VIEWER_PATH/public/data"

if [ ! -d "$INBOX_PATH" ]; then
    echo -e "${RED}Error: Could not find the 'inbox' folder within the export.${NC}"
    echo "Expected path: $INBOX_PATH"
    exit 1
fi

mkdir -p "$TARGET_DATA_DIR"

# 5. Loop through each chat folder in the inbox
for chat_folder in "$INBOX_PATH"/*; do
    if [ -d "$chat_folder" ]; then
        FOLDER_NAME=$(basename "$chat_folder")
        USER_DIR="$TARGET_DATA_DIR/$FOLDER_NAME"
        
        echo -e "\n${GREEN}Processing User: $FOLDER_NAME${NC}"
        mkdir -p "$USER_DIR"

        # Run the merge script (Reverse files, fix unicode, minify)
        node "$ABS_VIEWER_PATH/scripts/merge.js" "$chat_folder" "$USER_DIR/combined.json"

        # Handle Media Assets
        if [ "$ACTION_CHOICE" == "2" ]; then
            # Move media if folders exist
            [ -d "$chat_folder/photos" ] && mv "$chat_folder/photos" "$USER_DIR/"
            [ -d "$chat_folder/videos" ] && mv "$chat_folder/videos" "$USER_DIR/"
            [ -d "$chat_folder/audio" ] && mv "$chat_folder/audio" "$USER_DIR/"
        else
            # Copy media if folders exist
            [ -d "$chat_folder/photos" ] && cp -r "$chat_folder/photos" "$USER_DIR/"
            [ -d "$chat_folder/videos" ] && cp -r "$chat_folder/videos" "$USER_DIR/"
            [ -d "$chat_folder/audio" ] && cp -r "$chat_folder/audio" "$USER_DIR/"
        fi
    fi
done

echo -e "\n------------------------------------------"
echo -e "${GREEN}SUCCESS!${NC} All chats have been merged and minified."
echo "You can now view them in the dashboard."
echo "------------------------------------------"
exit 0