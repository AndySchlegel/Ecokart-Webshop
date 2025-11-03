#!/bin/bash
# ============================================================================
# Shortcut: Ruft das eigentliche Script auf
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the main script
exec "$SCRIPT_DIR/../../scripts/connect-github.sh" "$@"
