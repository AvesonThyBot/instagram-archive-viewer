#!/bin/bash

# --- Instagram Archive Viewer: File Merger ---
# Usage: ./merge.sh {path/of/zip/folder}

echo "IMPORTANT: Put all Instagram export zip files into a single folder then run this script with folder directory"

TARGET_DIR=$1

# 1. Validation
if [ -z "$TARGET_DIR" ]; then
    echo "Error: Please provide a folder path. Usage: ./merge.sh \"folder/\""
    exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Directory $TARGET_DIR does not exist."
    exit 1
fi

cd "$TARGET_DIR" || exit

# 2. Setup internal folders
mkdir -p zip-files
mkdir -p Instagram-export

# 3. Iterate and Unzip with Counter
ZIP_FILES=(*.zip)
TOTAL_ZIPS=${#ZIP_FILES[@]}
ZIP_COUNT=0

echo "Starting extraction of $TOTAL_ZIPS files..."

for zipfile in "${ZIP_FILES[@]}"; do
    if [ -f "$zipfile" ]; then
        ((ZIP_COUNT++))
        echo -n "[$ZIP_COUNT/$TOTAL_ZIPS] Extracting $zipfile... "
        
        # Unzip and move
        unzip -q "$zipfile" -d "temp_${zipfile%.*}"
        mv "$zipfile" zip-files/
        
        echo "Done."
    fi
done

# 4. Unify 'your_instagram_activity' with Spinner
echo "Unifying data folders (this may take a while)..."
UNZIPPED_FOLDERS=$(ls -d temp_*/ 2>/dev/null)

for folder in $UNZIPPED_FOLDERS; do
    if [ -d "${folder}your_instagram_activity" ]; then
        # Run copy in background to attach spinner
        cp -rn "${folder}your_instagram_activity/"* "Instagram-export/" &
        spinner $!
    fi
    rm -rf "$folder"
done

# 5. Statistics & Completion
echo "Calculating final stats..."
FINAL_SIZE=$(du -sh Instagram-export | awk '{print $1}')
FILE_COUNT=$(find Instagram-export -type f | wc -l | xargs)

echo "------------------------------------------------"
echo "Merge Completed Successfully!"
echo "Stats:"
echo "   - Original Zips Processed: $ZIP_COUNT"
echo "   - Unified Folder Size: $FINAL_SIZE"
echo "   - Total Files in Export: $FILE_COUNT"
echo "------------------------------------------------"
echo "Original zips are safe in '$(pwd)/zip-files'"
echo "Unified data is ready in '$(pwd)/Instagram-export'"
