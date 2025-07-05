#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const distDir = path.join(__dirname, "dist");
const extensions = [".js", ".ts", ".json"];

/**
 * Recursively get all .js files in a directory
 */
function getAllJsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Check if a file exists with any of the given extensions
 */
function findFileWithExtension(basePath, extensions) {
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath)) {
      return ext;
    }
  }
  return null;
}

/**
 * Check if a directory has an index file
 */
function hasIndexFile(dirPath, extensions) {
  for (const ext of extensions) {
    const indexPath = path.join(dirPath, "index" + ext);
    if (fs.existsSync(indexPath)) {
      return "/index" + ext;
    }
  }
  return null;
}

/**
 * Fix imports in a single file
 */
function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const fileDir = path.dirname(filePath);

    // Regex to match import/export statements
    const importRegex =
      /(?:import|export)(?:\s+.*?\s+from)?\s+['"]([^'"]+)['"]/g;

    let modified = false;
    const newContent = content.replace(importRegex, (match, importPath) => {
      // Skip if it's already an absolute path, has extension, or is a node_modules import
      if (
        importPath.startsWith(".") === false ||
        (importPath.includes(".") &&
          !importPath.startsWith("./") &&
          !importPath.startsWith("../")) ||
        importPath.match(/\.(js|ts|json)$/)
      ) {
        return match;
      }

      // Resolve the absolute path
      const absolutePath = path.resolve(fileDir, importPath);

      // Check if it's a file
      const fileExtension = findFileWithExtension(absolutePath, extensions);
      if (fileExtension) {
        const newImportPath = importPath + fileExtension;
        modified = true;
        return match.replace(importPath, newImportPath);
      }

      // Check if it's a directory with index file
      if (
        fs.existsSync(absolutePath) &&
        fs.statSync(absolutePath).isDirectory()
      ) {
        const indexFile = hasIndexFile(absolutePath, extensions);
        if (indexFile) {
          const newImportPath = importPath + indexFile;
          modified = true;
          return match.replace(importPath, newImportPath);
        }
      }

      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`✓ Fixed imports in: ${path.relative(distDir, filePath)}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main function
 */
function fixImports() {
  if (!fs.existsSync(distDir)) {
    console.error("❌ dist directory not found. Please run build first.");
    process.exit(1);
  }

  console.log("🔧 Fixing ES module imports...");

  const jsFiles = getAllJsFiles(distDir);

  if (jsFiles.length === 0) {
    console.log("⚠️  No JavaScript files found in dist directory.");
    return;
  }

  console.log(`📁 Found ${jsFiles.length} JavaScript files to process.`);

  for (const file of jsFiles) {
    fixImportsInFile(file);
  }

  console.log("✅ Import fixing completed!");
}

// Run the script
fixImports();
