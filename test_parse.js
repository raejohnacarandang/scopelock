const babel = require('@babel/core');
const fs = require('fs');
const js = fs.readFileSync('temp_check.js', 'utf8');
const lines = js.split('\n');

for(let checkLines = 1; checkLines < 6100; checkLines += 100) {
  const codeToCheck = lines.slice(0, checkLines).join('\n');

  try {
    babel.transformSync(codeToCheck, {
      presets: [['@babel/preset-react', {runtime: 'automatic'}]]
    });
  } catch(e) {
    console.log('Error at', checkLines + ':', e.message.slice(0,100));
    console.log('Line:', e.loc?.line);
    break;
  }
}
console.log('All checks passed');
