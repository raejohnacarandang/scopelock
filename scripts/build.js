#!/usr/bin/env node
/**
 * ScopeLock Production Build Script
 * Transpiles JSX from app.html and outputs production-ready files
 * 
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_HTML = path.join(ROOT, 'app.html');
const TEMP_CODE = path.join(ROOT, 'temp_code.js');
const DIST = path.join(ROOT, 'dist');

// Create dist directory
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// Find script boundaries in app.html
const appHtml = fs.readFileSync(APP_HTML, 'utf8');
const scriptStart = appHtml.indexOf('<script type="text/babel">');
const scriptEnd = appHtml.indexOf('</script>', scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Error: Could not find script boundaries in app.html');
  process.exit(1);
}

// Extract header (before script) and footer (after script)
const header = appHtml.substring(0, scriptStart + '<script type="text/babel">\n'.length);
const footer = '\n</script>\n' + appHtml.substring(scriptEnd + '</script>'.length);

// Extract the JS code (or use temp_code.js if available)
let jsCode;
if (fs.existsSync(TEMP_CODE)) {
  jsCode = fs.readFileSync(TEMP_CODE, 'utf8');
  console.log('Using temp_code.js as source');
} else {
  jsCode = appHtml.substring(scriptStart + '<script type="text/babel">'.length, scriptEnd);
  console.log('Using embedded script from app.html');
}

// Write source to dist
fs.writeFileSync(path.join(DIST, 'app.js'), jsCode);
console.log('Source written to dist/app.js');

// Now try to transpile with babel
try {
  const babel = require('@babel/core');
  
  const result = babel.transformSync(jsCode, {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    filename: 'app.jsx',
    sourceMaps: false,
    minified: true
  });
  
  fs.writeFileSync(path.join(DIST, 'app.min.js'), result.code);
  console.log('Transpiled to dist/app.min.js (' + (result.code.length / 1024).toFixed(1) + ' KB)');
  
  // Create production HTML that uses the transpiled script
  const prodHtml = header + '\n' + result.code + footer;
  fs.writeFileSync(path.join(DIST, 'index.html'), prodHtml);
  console.log('Production HTML written to dist/index.html');
  
} catch (e) {
  console.error('Babel transpilation failed:', e.message);
  console.log('Creating source-only build in dist/');
  
  // Create HTML that loads app.js instead of using inline babel
  const sourceHtml = appHtml.replace('<script type="text/babel">', '<script src="app.js">');
  fs.writeFileSync(path.join(DIST, 'index.html'), sourceHtml);
  console.log('Source HTML written to dist/index.html');
}

console.log('\nBuild complete! Files in dist/:');
fs.readdirSync(DIST).forEach(f => {
  const size = fs.statSync(path.join(DIST, f)).size;
  console.log('  - ' + f + ' (' + (size / 1024).toFixed(1) + ' KB)');
});