const fs = require('fs');
const h = fs.readFileSync('app.html').toString();
const m = h.match(/type="text\/babel">([\s\S]*?)<\/script>/);
if (m) {
  const js = m[1];
  const lines = js.split('\n');
  let o = 0, c = 0;
  for (let i = 0; i < lines.length; i++) {
    for (let ch of lines[i]) {
      if (ch === '{') o++;
      if (ch === '}') c++;
    }
    if (i >= 1114 && i <= 1150) {
      console.log('Line', i + 1, 'O:', o, 'C:', c, 'Diff:', o - c);
    }
  }
}
