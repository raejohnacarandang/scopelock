#!/usr/bin/env node
/**
 * Build production files:
 * 1. dist/app.min.js - compiled from temp_code.js (no JSX runtime needed in browser)
 * 2. dist/index.html - loads compiled JS via <script src> (no babel-standalone)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMP_CODE = path.join(ROOT, 'temp_code.js');
const APP_HTML = path.join(ROOT, 'app.html');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
if (!fs.existsSync(TEMP_CODE)) { console.error('temp_code.js not found'); process.exit(1); }

const jsCode = fs.readFileSync(TEMP_CODE, 'utf8');
console.log('Source: temp_code.js (' + (jsCode.length / 1024).toFixed(1) + ' KB)');

const babel = require('@babel/core');
const result = babel.transformSync(jsCode, {
  presets: [['@babel/preset-react', { runtime: 'classic', pragma: 'React.createElement', pragmaFrag: 'React.Fragment' }]],
  filename: 'app.jsx',
  minified: true
});

fs.writeFileSync(path.join(DIST, 'app.min.js'), result.code);
console.log('Compiled: dist/app.min.js (' + (result.code.length / 1024).toFixed(1) + ' KB)');

// Build index.html that loads the compiled JS (no babel needed)
const appHtml = fs.readFileSync(APP_HTML, 'utf8');
const scriptStart = appHtml.indexOf('<script type="text/babel">');
const scriptEnd = appHtml.indexOf('</script>', scriptStart);

if (scriptStart === -1) { console.error('No babel script tag'); process.exit(1); }

// Replace <script type="text/babel"> with <script src="app.min.js">
const prodHtml = appHtml.substring(0, scriptStart) +
  '<script src="app.min.js">' +
  appHtml.substring(scriptEnd + '</script>'.length);

fs.writeFileSync(path.join(DIST, 'index.html'), prodHtml);

// Also update app.html to use precompiled version (no babel)
const updatedAppHtml = appHtml.substring(0, scriptStart) +
  '<script>\n' + result.code + '\n</script>' +
  appHtml.substring(scriptEnd + '</script>'.length);

fs.writeFileSync(APP_HTML, updatedAppHtml);
console.log('Updated app.html with pre-compiled code (no babel-standalone)');

console.log('\nBuild complete!');
fs.readdirSync(DIST).forEach(f => {
  const size = fs.statSync(path.join(DIST, f)).size;
  console.log('  dist/' + f + ' (' + (size / 1024).toFixed(1) + ' KB)');
});