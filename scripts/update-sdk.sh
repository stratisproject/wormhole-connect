#!/bin/bash

# Update SDK Packages
# Updates all Wormhole SDK packages to the specified version (if provided), creates a new branch,
# and commits the changes with a predefined commit message. If no version is provided, the latest version
# of @xertraplatform/wormhole-sdk will be fetched from the registry.

# bun run sdk:update
# → Finds latest SDK version (X.Y.Z)
# → Creates branch update-sdk-X.Y.Z

# bun run sdk:update 3.4.5
# → Uses version 3.4.5
# → Creates branch update-sdk-3.4.5

# bun run sdk:update 3.4.5 PROD-123
# → Uses version 3.4.5
# → Creates branch PROD-123

# bun run sdk:update PROD-123 (not semver)
# → Grabs latest SDK version
# → Creates branch PROD-123

PORTAL_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$PORTAL_ROOT"

# Simple regex for semver (X.Y.Z, optionally with prerelease/build tags)
SEMVER_REGEX="^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$"

# If no args → grab latest version, default branch naming
if [ -z "$1" ]; then
  echo "⚠️  No version or ticket provided. Finding most recent @xertraplatform/wormhole-sdk version..."
  VERSION=$(bun pm view @xertraplatform/wormhole-sdk version 2>/dev/null || npm view @xertraplatform/wormhole-sdk version)
  BRANCH_NAME="update-sdk-$VERSION"
  echo "✅ Using latest version: $VERSION"
else
  if [[ "$1" =~ $SEMVER_REGEX ]]; then
    # First arg is a version
    VERSION="$1"
    BRANCH_NAME="${2:-update-sdk-$VERSION}"
  else
    # First arg is not a semver → treat as ticket
    VERSION=$(bun pm view @xertraplatform/wormhole-sdk version 2>/dev/null || npm view @xertraplatform/wormhole-sdk version)
    BRANCH_NAME="$1"
    echo "⚠️  First argument '$1' is not a version. Using latest SDK version: $VERSION"
  fi
fi

git checkout development
git pull origin development
git branch -D "$BRANCH_NAME" 2>/dev/null
git checkout -b "$BRANCH_NAME"

# Update dependencies and overrides in package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = '$VERSION';

// SDK packages to update in dependencies
const sdkPackages = [
  '@xertraplatform/wormhole-sdk',
  '@xertraplatform/wormhole-sdk-aptos',
  '@xertraplatform/wormhole-sdk-aptos-core',
  '@xertraplatform/wormhole-sdk-base',
  '@xertraplatform/wormhole-sdk-connect',
  '@xertraplatform/wormhole-sdk-definitions',
  '@xertraplatform/wormhole-sdk-evm',
  '@xertraplatform/wormhole-sdk-evm-core',
  '@xertraplatform/wormhole-sdk-icons',
  '@xertraplatform/wormhole-sdk-solana',
  '@xertraplatform/wormhole-sdk-solana-cctp',
  '@xertraplatform/wormhole-sdk-solana-core',
  '@xertraplatform/wormhole-sdk-sui',
  '@xertraplatform/wormhole-sdk-sui-cctp',
  '@xertraplatform/wormhole-sdk-sui-core',
];

// Update dependencies
sdkPackages.forEach(pkg_name => {
  if (pkg.dependencies && pkg.dependencies[pkg_name]) {
    pkg.dependencies[pkg_name] = version;
  }
});

// Update npm overrides
if (pkg.overrides) {
  const updateOverrides = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // Recursively update nested overrides
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (nestedKey.startsWith('@xertraplatform/wormhole-sdk') && !nestedKey.includes('-ntt')) {
            value[nestedKey] = version;
          }
        }
      } else if (key.startsWith('@xertraplatform/wormhole-sdk') && !key.includes('-ntt')) {
        obj[key] = version;
      }
    }
  };

  updateOverrides(pkg.overrides);
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Install to update lockfile with new versions
bun install

git add .
git commit -m "chore: update SDK packages to $VERSION"

echo "✅ SDK update complete. Branch '$BRANCH_NAME' created with SDK version $VERSION."
