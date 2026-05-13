#!/usr/bin/env node
/**
 * Build production files with external JS file (no inline script escaping issues)
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

// For dist/index.html: use external script file
const appHtml = fs.readFileSync(APP_HTML, 'utf8');
// Find the inline script (after <div id="root"></div>)
const rootIdx = appHtml.indexOf('<div id="root"></div>');
if (rootIdx === -1) { console.error('No root div found'); process.exit(1); }
let scriptStart = appHtml.indexOf('<script', rootIdx);
if (scriptStart === -1) { console.error('No inline script found'); process.exit(1); }
const scriptEnd = appHtml.indexOf('</script>', scriptStart);
if (scriptEnd === -1) { console.error('No closing script tag found'); process.exit(1); }

// dist/index.html: load app.min.js as external script (no escaping needed)
const distHtml = appHtml.substring(0, scriptStart) +
  '<script src="app.min.js"><\/script>' +
  appHtml.substring(scriptEnd + '</script>'.length);
fs.writeFileSync(path.join(DIST, 'index.html'), distHtml);
console.log('dist/index.html uses external app.min.js');

// For app.html (single-file deployment): inline with escaped </script>
const escapedCode = result.code.replace(/<\/script>/gi, '<\\/script>');
const prodHtml = appHtml.substring(0, scriptStart) +
  '<script>' + escapedCode + '</script>' +
  appHtml.substring(scriptEnd + '</script>'.length);
fs.writeFileSync(APP_HTML, prodHtml);
console.log('Updated app.html (inline with escaped </script>)');

console.log('\nBuild complete!');
fs.readdirSync(DIST).forEach(f => {
  const size = fs.statSync(path.join(DIST, f)).size;
  console.log('  dist/' + f + ' (' + (size / 1024).toFixed(1) + ' KB)');
});