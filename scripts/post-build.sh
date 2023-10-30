#!/bin/bash

# This script is used to run commands post-build.

set -o errexit -o nounset -o pipefail

echo "Running post-build commands..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# We deploy all other projects to _deployments. This allows us to visit them using /project instead of /_deployments/project.
ln -s "_deployments/onboarding-form" "$PROJECT_DIR/out/onboarding-form-test"

# Optimize images
# https://next-export-optimize-images.vercel.app/docs/getting-started
# Disabled for now, because the generated images are often larger than the originals.
# npm run optimize-images
