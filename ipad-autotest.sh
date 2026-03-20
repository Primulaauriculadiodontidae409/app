#!/bin/bash
# iPad Simulator automated UI test with screenshot capture
# Prerequisites:
#   - iPad simulator booted (xcrun simctl list devices booted)
#   - MongoDB running locally on port 27017
#   - mango_test database with users collection exists
#
# Usage: bash ipad-autotest.sh [--build]
#   --build   Build and deploy before running (calls ios-sim.sh)

set -e

MANGO_DIR="$(cd "$(dirname "$0")" && pwd)"
BUNDLE_ID="com.skelpo.mango"
SCREENSHOT_DIR="$MANGO_DIR/test-screenshots"
mkdir -p "$SCREENSHOT_DIR"

# Clean old screenshots
rm -f "$SCREENSHOT_DIR"/step-*.png

# Build and deploy if requested
if [ "$1" = "--build" ]; then
  echo "==> Building and deploying to iPad Simulator..."
  bash "$MANGO_DIR/ios-sim.sh"
  echo "==> Waiting for app to start..."
  sleep 3
else
  echo "==> Launching app (already installed)..."
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null || true
  sleep 1
  xcrun simctl launch booted "$BUNDLE_ID"
  sleep 3
fi

# The app's runAutoTest() pauses 2-3 seconds between steps.
# We capture screenshots at each pause point using relative delays.
# Steps match runAutoTest() in app.ts:
#   1. Connection screen (launch)
#   2. Connection form shown
#   3. Form filled, connection saved
#   4. Connected, browser screen, databases loaded
#   5. mango_test database expanded
#   6. users collection selected, documents loaded
#   7. Edit view for first document
#   8. Edit view closed, back to documents
#   9. Disconnected, back to connection screen
#  10. Test connection cleaned up

STEPS=(
  "01-connection-screen:7"
  "02-connection-form:5"
  "03-connection-saved:5"
  "04-browser-databases:6"
  "05-database-expanded:5"
  "06-collection-documents:5"
  "07-document-edit:5"
  "08-documents-list:5"
  "09-disconnected:5"
  "10-test-complete:5"
)

echo "==> Capturing screenshots..."
echo "    Output: $SCREENSHOT_DIR/"
echo ""

for step in "${STEPS[@]}"; do
  NAME="${step%%:*}"
  DELAY="${step##*:}"
  sleep "$DELAY"
  OUTFILE="$SCREENSHOT_DIR/step-${NAME}.png"
  xcrun simctl io booted screenshot "$OUTFILE" 2>/dev/null
  echo "  ✓ $NAME"
  # Reset delay counter — next sleep is relative
done

echo ""
echo "==> All screenshots captured!"
echo "    View: open $SCREENSHOT_DIR"
open "$SCREENSHOT_DIR"
