#!/bin/bash

# Cleanup script for MagicVial project

echo "Starting project cleanup..."

# Remove duplicate directories
echo "Removing redundant directories..."

# If both frontend/ and apps/frontend/ exist, keep only apps/frontend/
if [ -d "frontend" ] && [ -d "apps/frontend" ]; then
  echo "Removing redundant frontend/ directory..."
  rm -rf frontend
fi

# If both backend/ and apps/backend/ exist, keep only apps/backend/
if [ -d "backend" ] && [ -d "apps/backend" ]; then
  echo "Removing redundant backend/ directory..."
  rm -rf backend
fi

# Remove node_modules in root if using workspaces
if [ -f "package.json" ] && grep -q "workspaces" package.json; then
  echo "Detected workspace configuration, cleaning up root node_modules..."
  rm -rf node_modules
fi

# Clean up temporary files
echo "Removing temporary files..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "*.swp" -type f -delete
find . -name "*.swo" -type f -delete

# Clean contract files in root
echo "Organizing contract files..."
if [ -f "Material.rs" ] || [ -f "Recipe.rs" ] || [ -f "Crafting.rs" ] || [ -f "Guild.rs" ] || [ -f "MagicVialToken.rs" ]; then
  mkdir -p contracts/src/programs
  [ -f "Material.rs" ] && mv Material.rs contracts/src/programs/
  [ -f "Recipe.rs" ] && mv Recipe.rs contracts/src/programs/
  [ -f "Crafting.rs" ] && mv Crafting.rs contracts/src/programs/
  [ -f "Guild.rs" ] && mv Guild.rs contracts/src/programs/
  [ -f "MagicVialToken.rs" ] && mv MagicVialToken.rs contracts/src/programs/
fi

echo "Cleanup completed successfully!"
exit 0 