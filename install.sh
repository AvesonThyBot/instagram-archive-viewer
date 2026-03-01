#!/bin/bash

# --- Instagram Archive Viewer Installer ---
# Usage: ./install.sh {path/to/export/folder} {path/to/archive-viewer/folder}

# Assign arguments to variables
EXPORT_PATH=$1
VIEWER_PATH=$2

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "------------------------------------------"
echo "Instagram Archive Viewer: Data Importer"
echo "------------------------------------------"

# Check if both arguments are provided
if [ -z "$EXPORT_PATH" ] || [ -z "$VIEWER_PATH" ]; then
    echo -e "${RED}Error: Missing arguments.${NC}"
    echo "Usage: ./install.sh <export_path> <viewer_path>"
    exit 1
fi

# Convert to absolute paths (handles relative paths like ./ or ../)
ABS_EXPORT_PATH=$(cd "$(dirname "$EXPORT_PATH")" && pwd)/$(basename "$EXPORT_PATH")
ABS_VIEWER_PATH=$(cd "$(dirname "$VIEWER_PATH")" && pwd)/$(basename "$VIEWER_PATH")

# Test Output
echo -e "${GREEN}Testing Paths...${NC}"
echo "Source Export: $ABS_EXPORT_PATH"
echo "Target Viewer: $ABS_VIEWER_PATH"

echo "------------------------------------------"
echo "Test complete. Closing script."
exit 0