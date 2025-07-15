#!/bin/bash

# Base directory
BASE_DIR="backend"

echo "Creating base directory: $BASE_DIR"
mkdir -p "$BASE_DIR"

echo "Creating combined-app structure..."
mkdir -p "$BASE_DIR/marking-service/src/routes" \
         "$BASE_DIR/marking-service/src/middleware" \
         "$BASE_DIR/marking-service/src/config" \
         "$BASE_DIR/marking-service/src/types" \
         "$BASE_DIR/marking-service/src/utils" \
         "$BASE_DIR/marking-service/dist"

# echo "Creating individual service directories (existing structure placeholders)..."
# mkdir -p "$BASE_DIR/auth-service" \
#          "$BASE_DIR/property-service" \
#          "$BASE_DIR/payment-service" \
#          "$BASE_DIR/booking-service" \
#          "$BASE_DIR/marking-service" \
#          "$BASE_DIR/admin-service" \
#          "$BASE_DIR/referral-service" \
#          "$BASE_DIR/notification-service" \
#          "$BASE_DIR/analytics-service" \
#          "$BASE_DIR/shared"

echo "Folder structure created successfully under $BASE_DIR/"

# You can verify by running:
# tree "$BASE_DIR"
# (You might need to install 'tree' command if not already available: sudo apt-get install tree or brew install tree)
