#!/bin/bash

# This script is used to generate/update fixtures (data) for the website.

set -o errexit -o nounset -o pipefail

echo "Generating fixtures..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
HOST_CONFIG_FILE="$PROJECT_DIR/../directory/hosts/host-config.yml"

# Clean up any previous fixtures
git worktree remove "$PROJECT_DIR/build/data" 2>/dev/null || true
rm -rf "$PROJECT_DIR/build/data"
rm -rf "$PROJECT_DIR/build/fixtures"

# Create the fixture directory
mkdir -p "$PROJECT_DIR/build/fixtures"

# TODO: have a way to download the latest fixtures from the website so that the public
# can run the development server too.

# Create a new worktree
git worktree add "$PROJECT_DIR/build/data" origin/data

# Generate fixtures
python3 "$SCRIPT_DIR/generate-machine-info.py" "$HOST_CONFIG_FILE" "$PROJECT_DIR/build/data" "$PROJECT_DIR/build/fixtures"
# Add typescript types
./node_modules/.bin/quicktype -o "$PROJECT_DIR"/build/fixtures/machine-info.{ts,json}

python3 "$SCRIPT_DIR/generate-website-config.py" "$PROJECT_DIR/../outputs" "$PROJECT_DIR/build/fixtures"
./node_modules/.bin/quicktype -o "$PROJECT_DIR"/build/fixtures/website-config.{ts,json}
