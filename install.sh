#!/bin/bash

# --- Instagram Archive Viewer: Unified Installer ---
# Usage: ./install.sh {optional: path/of/zip/folder}

REPO_PATH=$(pwd)/instagram-archive-viewer
TARGET_DATA_DIR="$REPO_PATH/public/data"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}------------------------------------------${NC}"
echo -e "${CYAN}Instagram Archive Viewer: Unified Setup${NC}"
echo -e "${CYAN}------------------------------------------${NC}"

#  Validation: Path Input
ZIP_SOURCE_DIR=$1

# If no argument was provided, ask once and mention arguments
if [ -z "$ZIP_SOURCE_DIR" ]; then
    echo -e "${YELLOW}Tip: You can skip this prompt next time by passing the path as an argument:${NC}"
    echo -e "${CYAN}Usage: ./install.sh /path/to/zips${NC}\n"
    
    echo -n "Please enter the folder path containing your Instagram ZIP files: "
    read -r ZIP_SOURCE_DIR
fi

# Clean up trailing slashes
ZIP_SOURCE_DIR=$(echo "$ZIP_SOURCE_DIR" | sed 's:/*$::')

# Final check: If it's still empty or not a directory, exit
if [ -z "$ZIP_SOURCE_DIR" ] || [ ! -d "$ZIP_SOURCE_DIR" ]; then
    echo -e "${RED}Error: Directory '$ZIP_SOURCE_DIR' not found or not provided.${NC}"
    exit 1
fi

# Bright Warning Message
echo -e "\n${YELLOW}*******************************************************************"
echo -e "IMPORTANT: Put all Instagram export zip files into a single folder"
echo -e "*******************************************************************${NC}\n"

# User Confirmation
read -p "Do you want to progress with the extraction? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Setup cancelled by user."
    exit 0
fi

# Folder Merge: Preparation
mkdir -p "$TARGET_DATA_DIR"
# Get absolute path for source to avoid issues when changing directories
ABS_ZIP_DIR=$(cd "$ZIP_SOURCE_DIR" && pwd)
cd "$ABS_ZIP_DIR" || exit

ZIP_FILES=(*.zip)
TOTAL_ZIPS=${#ZIP_FILES[@]}

if [ "$TOTAL_ZIPS" -eq 0 ]; then
    echo -e "${RED}Error: No .zip files found in $ABS_ZIP_DIR${NC}"
    exit 1
fi

# Folder Merge: Extraction Phase
echo "Step 1: Extracting $TOTAL_ZIPS archives..."
for ((i=0; i<TOTAL_ZIPS; i++)); do
    zipfile="${ZIP_FILES[$i]}"
    echo -n "[$(($i+1))/$TOTAL_ZIPS] Extracting $zipfile... "
    
    # Extract directly to the target project folder
    # Use a temp subfolder to prevent collisions during the unzip process
    unzip -q "$zipfile" -d "$TARGET_DATA_DIR/temp_${zipfile%.*}"
    echo "Done."
done

# Folder Merge: Unification Phase
echo "Step 2: Unifying data into public/data/your_instagram_activity..."
cd "$TARGET_DATA_DIR" || exit

TEMP_FOLDERS=$(ls -d temp_*/ 2>/dev/null)
for folder in $TEMP_FOLDERS; do
    if [ -d "${folder}your_instagram_activity" ]; then
        # Move content to top level of public/data/
        cp -rn "${folder}your_instagram_activity" .
    fi
    rm -rf "$folder"
done

# JSON Merge: Processing Phase (Minification)
echo -e "\nStep 3: Minifying JSON files and optimizing space..."
if [ -f "$REPO_PATH/scripts/jsonMerge.js" ]; then
    node "$REPO_PATH/scripts/jsonMerge.js" "$TARGET_DATA_DIR/your_instagram_activity"
else
    echo -e "${RED}Warning: scripts/jsonMerge.js not found. Skipping minification.${NC}"
fi

# Final Stats
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Format duration into minutes and seconds
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

FINAL_SIZE=$(du -sh "$TARGET_DATA_DIR" | awk '{print $1}')
FILE_COUNT=$(find "$TARGET_DATA_DIR" -type f | wc -l | xargs)

echo "------------------------------------------------"
echo -e "${GREEN}Setup Completed Successfully!${NC}"
echo "Stats:"
echo "   - Archives Processed: $TOTAL_ZIPS"
echo "   - Final Data Size: $FINAL_SIZE"
echo "   - Total Files in public/data: $FILE_COUNT"
echo "   - Time Elapsed: ${MINUTES}m ${SECONDS}s"
echo "------------------------------------------------"
echo "Your data is ready in: $TARGET_DATA_DIR"