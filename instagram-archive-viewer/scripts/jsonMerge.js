import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jsonminify = require('jsonminify');

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Usage: node jsonMerge.js <directory>');
  process.exit(1);
}

// Recursively walks through a directory and executes a callback for each file
function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}

// Fixes Instagram's specific encoding issue where UTF-8 bytes are treated as Latin-1
function fixEncoding(str) {
  if (typeof str !== 'string') return str;
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

// Recursively applies encoding fix to all strings in an object
function fixObjectEncoding(obj) {
  if (typeof obj === 'string') {
    return fixEncoding(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(fixObjectEncoding);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[fixEncoding(key)] = fixObjectEncoding(obj[key]);
    }
    return newObj;
  }
  return obj;
}

console.log(`\n[*] Starting data optimization in: ${targetDir}`);

// 1. Group message_*.json files by directory
const chatGroups = {};

walk(targetDir, (filePath) => {
  const fileName = path.basename(filePath);
  if (fileName.startsWith('message_') && fileName.endsWith('.json')) {
    const dir = path.dirname(filePath);
    if (!chatGroups[dir]) chatGroups[dir] = [];
    chatGroups[dir].push(filePath);
  }
});

// 2. Merge message_*.json files in each chat directory
for (const dir in chatGroups) {
  const files = chatGroups[dir].sort((a, b) => {
    const matchA = path.basename(a).match(/\d+/);
    const matchB = path.basename(b).match(/\d+/);
    const nA = matchA ? parseInt(matchA[0], 10) : 0;
    const nB = matchB ? parseInt(matchB[0], 10) : 0;
    return nA - nB;
  });

  const relativeDir = path.relative(targetDir, dir);
  console.log(`  -> Merging ${files.length} parts for chat: ${relativeDir}`);

  try {
    let combinedData = null;

    for (let i = 0; i < files.length; i++) {
      const fileContent = fs.readFileSync(files[i], 'utf8');
      const data = JSON.parse(fileContent);

      if (i === 0) {
        combinedData = data;
      } else if (data.messages && Array.isArray(data.messages)) {
        if (combinedData.messages && Array.isArray(combinedData.messages)) {
          combinedData.messages = combinedData.messages.concat(data.messages);
        }
      }
      
      // Remove the original part file to save space
      fs.unlinkSync(files[i]);
    }

    if (combinedData) {
      // Apply encoding fix to the merged data
      combinedData = fixObjectEncoding(combinedData);

      // Save as messages.json
      const outputPath = path.join(dir, 'messages.json');
      const jsonString = JSON.stringify(combinedData);
      
      // Minify using jsonminify
      const minified = jsonminify(jsonString);
      fs.writeFileSync(outputPath, minified);
    }
  } catch (err) {
    console.error(`  [!] Error processing chat in ${dir}:`, err.message);
  }
}

// 3. Minify all other JSON files in the directory tree
console.log(`\n[*] Minifying remaining JSON files...`);
let minifiedCount = 0;

walk(targetDir, (filePath) => {
  if (filePath.endsWith('.json') && path.basename(filePath) !== 'messages.json') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Only process if it looks like it's not minified
      if (content.includes('\n') || content.includes('  ')) {
        const minified = jsonminify(content);
        fs.writeFileSync(filePath, minified);
        minifiedCount++;
      }
    } catch (err) {
      console.error(`  [!] Could not minify ${filePath}:`, err.message);
    }
  }
});

console.log(`  -> Minified ${minifiedCount} additional files.`);
console.log('\n[+] Data optimization and unification complete!');
