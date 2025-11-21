#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Remove unnecessary files and directories from the build output
module.exports = function(context) {
  const appOutDir = context.appOutDir;

  const pathsToClean = [
    'Contents/Resources/app.asar.unpacked/node_modules/**/test',
    'Contents/Resources/app.asar.unpacked/node_modules/**/tests',
    'Contents/Resources/app.asar.unpacked/node_modules/**/docs',
    'Contents/Resources/app.asar.unpacked/node_modules/**/example',
    'Contents/Resources/app.asar.unpacked/node_modules/**/examples',
    'Contents/Resources/app.asar.unpacked/node_modules/**/.bin',
  ];
  
  console.log('Optimize package...');

  pathsToClean.forEach(relativePath => {
    try {
      const fullPath = path.join(appOutDir, relativePath);
      if (fs.existsSync(fullPath)) {
        console.log(`Remove: ${fullPath}`);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Error while cleaning ${relativePath}:`, err);
    }
  });
  
  console.log('DONE!');
  return true;
};
