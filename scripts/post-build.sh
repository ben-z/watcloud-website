#!/bin/bash

# This script is used to run commands post-build.

set -o errexit -o nounset -o pipefail

echo "Running post-build commands..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Optimize images
# https://next-export-optimize-images.vercel.app/docs/getting-started
# Disabled for now, because the generated images are often larger than the originals.
# npm run optimize-images
