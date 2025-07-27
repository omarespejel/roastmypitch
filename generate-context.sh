#!/bin/bash
#
# Description:
# This script generates a comprehensive prompt for an LLM by concatenating key source
# files from both the Python backend and the Next.js frontend, along with project
# configuration and directory structure.
#
# Usage:
# ./generate-context.sh
#

# --- Configuration ---

# Get current date for the output filename
DATE=$(date +%Y%m%d-%H%M)

# Output filename with a timestamp
OUTPUT_FILE="project-context-prompt-${DATE}.txt"

# --- Script Body ---

# Clean up any previous output file to start fresh
rm -f "$OUTPUT_FILE"

echo "🚀 Starting LLM prompt generation for the monorepo project..."
echo "------------------------------------------------------------"
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

# 1. Add a Preamble and Goal for the LLM
echo "Adding LLM preamble and goal..."
{
  echo "# Project Context & Goal"
  echo ""
  echo "## Goal for the LLM"
  echo "You are an expert full-stack developer and software architect with deep expertise in Python/FastAPI for backends and React/Next.js/TypeScript for frontends. Your task is to analyze the complete context of this monorepo project, which is provided below. Please review the project structure, dependencies, backend source code, frontend source code, and configuration, and then provide specific, actionable advice for improvement. Focus on code quality, best practices, potential bugs, architectural design, maintainability, and the synergy between the frontend and backend."
  echo ""
  echo "---"
  echo ""
} >> "$OUTPUT_FILE"

# 2. Add the project's directory structure (cleaned up)
echo "Adding cleaned directory structure..."
echo "## Directory Structure" >> "$OUTPUT_FILE"
if command -v tree &> /dev/null; then
    echo "  -> Adding directory structure (tree -L 5)"
    # Exclude common noise from the tree view for both backend and frontend
    tree -L 5 -I "__pycache__|.venv|venv|.git|.pytest_cache|.ruff_cache|.mypy_cache|htmlcov|*.pyc|node_modules|.next" >> "$OUTPUT_FILE"
else
    echo "  -> WARNING: 'tree' command not found. Skipping directory structure."
    echo "NOTE: 'tree' command was not found. Install it to include the directory structure." >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"


# 3. Add Core Project and Configuration Files
echo "Adding core project and configuration files..."
# Core files that provide project context from both backend and frontend
CORE_FILES=(
  "README.md"
  "backend/pyproject.toml"
  "frontend/package.json"
  "frontend/tsconfig.json"
  ".env.example"
  ".gitignore"
  "$0" # This script itself
)

for file in "${CORE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  -> Adding $file"
    echo "## FILE: $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  else
    echo "  -> WARNING: $file not found. Skipping."
  fi
done

# 4. Add all Python source files from the backend
echo "Adding all Python source files from the 'backend'..."
# Find all Python files, excluding common directories we don't want
find "backend" -type f -name "*.py" \
  -not -path "*/.venv/*" \
  -not -path "*/venv/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/.pytest_cache/*" \
  | while read -r py_file; do
    echo "  -> Adding Python file: $py_file"
    echo "## FILE: $py_file" >> "$OUTPUT_FILE"
    cat "$py_file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done

# 5. Add all TypeScript/JavaScript source files from the frontend
echo "Adding all TS/JS/TSX/JSX source files from the 'frontend'..."
find "frontend" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  | while read -r ts_file; do
    echo "  -> Adding Frontend file: $ts_file"
    echo "## FILE: $ts_file" >> "$OUTPUT_FILE"
    cat "$ts_file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done

# 6. Add key frontend styling and component files
echo "Adding other key frontend files (CSS, etc.)..."
find "frontend" -type f \( -name "*.css" -o -name "*.scss" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  | while read -r css_file; do
    echo "  -> Adding Frontend style file: $css_file"
    echo "## FILE: $css_file" >> "$OUTPUT_FILE"
    cat "$css_file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done


# --- Completion Summary ---

echo ""
echo "-------------------------------------"
echo "✅ Prompt generation complete!"
echo ""
echo "This context file now includes:"
echo "  ✓ A clear goal and preamble for the LLM"
echo "  ✓ A cleaned project directory structure"
echo "  ✓ Core project files (README.md, pyproject.toml, package.json, tsconfig.json)"
echo "  ✓ Configuration files (.gitignore, .env.example)"
echo "  ✓ This generation script itself"
echo "  ✓ All Python source code from the 'backend' directory (*.py)"
echo "  ✓ All TS/JS/TSX/JSX source code from the 'frontend' directory"
echo "  ✓ All CSS/SCSS source code from the 'frontend' directory"
echo ""
echo "File size: \$(du -h "\$OUTPUT_FILE" | cut -f1)"
echo "Total lines: \$(wc -l < "\$OUTPUT_FILE" | xargs)"
echo ""
echo "You can now use the content of '\$OUTPUT_FILE' as a context prompt for your LLM." 