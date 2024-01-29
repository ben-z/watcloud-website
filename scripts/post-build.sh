#!/bin/bash

# This script is used to run commands post-build.

set -o errexit -o nounset -o pipefail

echo "Running post-build commands..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Copy generated fixtures to the output directory
cp -r "$PROJECT_DIR/build/fixtures" "$PROJECT_DIR/out/."