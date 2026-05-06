#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️  Building TechDesk for Netlify deployment...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy frontend files
const filesToCopy = [
  'helpdesk.html',
  'admin.html',
  'styles.css',
  'admin.css',
  'script.js',
  'admin.js'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

// Rename helpdesk.html to index.html for Netlify
const htmlPath = path.join(distDir, 'helpdesk.html');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(htmlPath)) {
  fs.copyFileSync(htmlPath, indexPath);
  console.log('✅ Created index.html for Netlify');
}

console.log('🎉 Build complete! Ready for Netlify deployment.');
console.log('📁 Files built to: dist/');
console.log('🔧 Functions located at: netlify/functions/');