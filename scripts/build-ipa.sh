#!/usr/bin/env bash
# Build ExpenseTracker.ipa for SideStore / AltStore sideloading (free Apple ID).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE_PATH="$ROOT/build/ExpenseTracker.xcarchive"
EXPORT_PATH="$ROOT/build/ipa"
IPA_PATH="$ROOT/build/ExpenseTracker.ipa"
DEVICE_ID="${1:-}"

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"

if [[ ! -d "$DEVELOPER_DIR" ]]; then
  echo "Xcode not found. Install Xcode or set DEVELOPER_DIR."
  exit 1
fi

echo "==> Cleaning previous build"
rm -rf "$ROOT/build"
mkdir -p "$ROOT/build"

if [[ -n "$DEVICE_ID" ]]; then
  DESTINATION="-destination id=$DEVICE_ID"
else
  DESTINATION="-destination generic/platform=iOS"
fi

echo "==> Archiving (this signs with your Personal Team)"
xcodebuild \
  -project "$ROOT/ExpenseTracker.xcodeproj" \
  -scheme ExpenseTracker \
  $DESTINATION \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

echo "==> Exporting IPA"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$ROOT/ExportOptions.plist" \
  -allowProvisioningUpdates

mv "$EXPORT_PATH/ExpenseTracker.ipa" "$IPA_PATH"
echo ""
echo "Done: $IPA_PATH"
echo ""
echo "Next: install with SideStore (see docs/NO_MAC_WEEKLY.md)"
