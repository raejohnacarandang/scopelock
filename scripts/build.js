#!/usr/bin/env node
/**
 * ScopeLock Production Build Script
 * Transpiles JSX from temp_code.js to browser-compatible JS (no runtime imports)
 * 
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMP_CODE = path.join(ROOT, 'temp_code.js');
const APP_HTML = path.join(ROOT, 'app.html');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

if (!fs.existsSync(TEMP_CODE)) {
  console.error('Error: temp_code.js not found');
  process.exit(1);
}

const jsCode = fs.readFileSync(TEMP_CODE, 'utf8');
console.log('Source: temp_code.js (' + (jsCode.length / 1024).toFixed(1) + ' KB)');

const babel = require('@babel/core');

// Transform with classic JSX runtime (no import statements needed)
const result = babel.transformSync(jsCode, {
  presets: [
    ['@babel/preset-react', {
      runtime: 'classic',
      pragma: 'React.createElement',
      pragmaFrag: 'React.Fragment',
      throwIfNamespace: false,
      development: false,
      useBuiltIns: false
    }]
  ],
  filename: 'app.jsx',
  sourceMaps: false,
  minified: true
});

fs.writeFileSync(path.join(DIST, 'app.js'), result.code);
fs.writeFileSync(path.join(DIST, 'app.min.js'), result.code);
console.log('Compiled to dist/app.js (' + (result.code.length / 1024).toFixed(1) + ' KB)');

const appHtml = fs.readFileSync(APP_HTML, 'utf8');
const scriptStart = appHtml.indexOf('<script type="text/babel">');
const scriptEnd = appHtml.indexOf('</script>', scriptStart);

if (scriptStart === -1) {
  console.error('Error: Could not find babel script tag in app.html');
  process.exit(1);
}

const header = appHtml.substring(0, scriptStart + '<script type="text/babel">\n'.length);
const footer = '\n</script>\n' + appHtml.substring(scriptEnd + '</script>'.length);

const prodHtml = header + '\n' + result.code + footer;
fs.writeFileSync(path.join(DIST, 'index.html'), prodHtml);
console.log('Production HTML written to dist/index.html');

console.log('\nBuild complete! Files in dist/:');
fs.readdirSync(DIST).forEach(f => {
  const size = fs.statSync(path.join(DIST, f)).size;
  console.log('  - ' + f + ' (' + (size / 1024).toFixed(1) + ' KB)');
});