#!/bin/bash

# Start timer
START_TIME=$(date +%s)

# // ----- Path Logic -----
if [[ "$PWD" == *"/instagram-archive-viewer" ]]; then
    REPO_PATH=$(pwd)
else
    REPO_PATH=$(pwd)/instagram-archive-viewer
fi

TARGET_DATA_DIR="$REPO_PATH/public/data"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}------------------------------------------${NC}"
echo -e "${CYAN}Instagram Archive Viewer: Unified Setup${NC}"
echo -e "${CYAN}------------------------------------------${NC}"

# // ----- Action Menu & Validation -----
while true; do
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo "1) Full Install (Unzip, Merge, and Minify)"
    echo "2) JSON Merge Only (Fix encoding/minify existing data)"
    echo "3) Exit"
    read -p "Select an option [1-3]: " MAIN_CHOICE

    if [ "$MAIN_CHOICE" == "3" ]; then
        echo "Exiting..."
        exit 0
    elif [[ "$MAIN_CHOICE" == "1" || "$MAIN_CHOICE" == "2" ]]; then
        break
    else
        echo -e "${RED}Invalid selection. Please enter 1, 2, or 3.${NC}\n"
    fi
done

# // ----- Path Validation (Choice 1 Only) -----
if [ "$MAIN_CHOICE" == "1" ]; then
    ZIP_SOURCE_DIR=$1
    while [ -z "$ZIP_SOURCE_DIR" ] || [ ! -d "$ZIP_SOURCE_DIR" ]; do
        if [ -n "$ZIP_SOURCE_DIR" ] && [ ! -d "$ZIP_SOURCE_DIR" ]; then
            echo -e "${RED}Error: '$ZIP_SOURCE_DIR' is not a valid directory.${NC}"
        fi
        echo -e "${YELLOW}Tip: You can skip this by running: ./install.sh /path/to/zips${NC}"
        echo -n "Please enter the folder path containing your Instagram ZIP files: "
        read -r ZIP_SOURCE_DIR
        ZIP_SOURCE_DIR=$(echo "$ZIP_SOURCE_DIR" | sed 's:/*$::')
    done

    echo -e "\n${YELLOW}*******************************************************************"
    echo -e "IMPORTANT: Put all Instagram export zip files into a single folder"
    echo -e "*******************************************************************${NC}\n"

    echo -ne "${YELLOW}Do you want to progress with the extraction? (y/n): ${NC}"
    read CONFIRM
    
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled by user."
        exit 0
    fi

    # // ----- Extraction Logic -----
    mkdir -p "$TARGET_DATA_DIR"
    ABS_ZIP_DIR=$(cd "$ZIP_SOURCE_DIR" && pwd)
    cd "$ABS_ZIP_DIR" || exit

    ZIP_FILES=(*.zip)
    TOTAL_ZIPS=${#ZIP_FILES[@]}
    if [ "$TOTAL_ZIPS" -eq 0 ]; then
        echo -e "${RED}Error: No .zip files found in $ABS_ZIP_DIR${NC}"
        exit 1
    fi

    echo -e "${CYAN}Extracting $TOTAL_ZIPS archives...${NC}"
    for ((i=0; i<TOTAL_ZIPS; i++)); do
        zipfile="${ZIP_FILES[$i]}"
        CURRENT_ZIP=$((i + 1))
        PERCENT=$(( CURRENT_ZIP * 100 / TOTAL_ZIPS ))
        
        FILE_COUNT_IN_ZIP=$(unzip -l "$zipfile" | tail -n 1 | awk '{print $2}')
        
        echo -ne "   [${PERCENT}%] Extracting: $zipfile ($FILE_COUNT_IN_ZIP files)... \r"
        unzip -q "$zipfile" -d "$TARGET_DATA_DIR/temp_${zipfile%.*}"
        echo -ne "                                                                               \r"
    done
    echo -e "${GREEN}   Extraction Complete! ($TOTAL_ZIPS archives)                             ${NC}"

    # // ----- Unification Logic (Updated with \r) -----
    echo -e "${CYAN}Unifying data into public/data/your_instagram_activity...${NC}"
    cd "$TARGET_DATA_DIR" || exit
    TEMP_FOLDERS=$(ls -d temp_*/ 2>/dev/null)
    
    TEMP_ARRAY=($TEMP_FOLDERS)
    TOTAL_TEMP=${#TEMP_ARRAY[@]}
    CURRENT_TEMP=0

    for folder in "${TEMP_ARRAY[@]}"; do
        ((CURRENT_TEMP++))
        PERCENT=$(( CURRENT_TEMP * 100 / TOTAL_TEMP ))
        echo -ne "   [${PERCENT}%] Merging: $folder... \r"
        
        if [ -d "${folder}your_instagram_activity" ]; then
            cp -rn "${folder}your_instagram_activity" .
        fi
        rm -rf "$folder"
    done
    echo -ne "                                                                               \r"
    echo -e "${GREEN}   Unification Complete!                                                   ${NC}"
fi

# // ----- JSON Merge Phase -----
echo -e "\nOptimizing JSON files and fixing encoding..."
if [ -d "$TARGET_DATA_DIR/your_instagram_activity" ]; then
    if [ -f "$REPO_PATH/scripts/jsonMerge.js" ]; then
        node "$REPO_PATH/scripts/jsonMerge.js" "$TARGET_DATA_DIR/your_instagram_activity"
    else
        echo -e "${RED}Error: scripts/jsonMerge.js not found.${NC}"
    fi
else
    echo -e "${RED}Error: Data folder 'your_instagram_activity' not found in $TARGET_DATA_DIR.${NC}"
    echo "Please run a Full Install (Option 1) first."
    exit 1
fi

# // ----- Inbox Index Phase -----
echo -e "\n${CYAN}Building your inbox list for the desktop-style DM view...${NC}"
if [ -f "$REPO_PATH/scripts/buildInboxIndex.js" ]; then
    echo -e "   ${YELLOW}Reading each conversation and finding the latest message for every person...${NC}"
    node "$REPO_PATH/scripts/buildInboxIndex.js" "$TARGET_DATA_DIR/your_instagram_activity"
    echo -e "${GREEN}   Inbox data prepared successfully.${NC}"
else
    echo -e "${RED}Error: scripts/buildInboxIndex.js not found.${NC}"
    exit 1
fi

# // ----- Silent Package Installation (Final Step) -----
cd "$REPO_PATH" || exit
if [ -f "package.json" ]; then
    npm install --silent > /dev/null 2>&1
fi

# // ----- Final Stats -----
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

FINAL_SIZE=$(du -sh "$TARGET_DATA_DIR" 2>/dev/null | awk '{print $1}')
FILE_COUNT=$(find "$TARGET_DATA_DIR" -type f 2>/dev/null | wc -l | xargs)

echo "------------------------------------------------"
echo -e "${GREEN}Setup Completed Successfully!${NC}"
echo "Stats:"
[ "$MAIN_CHOICE" == "1" ] && echo "   - Archives Processed: $TOTAL_ZIPS"
echo "   - Final Data Size: $FINAL_SIZE"
echo "   - Total Files in public/data: $FILE_COUNT"
echo "   - Time Elapsed: ${MINUTES}m ${SECONDS}s"
echo "------------------------------------------------"
