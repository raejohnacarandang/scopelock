const fs = require('fs');
const h = fs.readFileSync('app.html', 'utf8');
const m = h.match(/<script type="babel">([\s\S]*?)<\/script>/);
if (m) {
  const js = m[1];
  let o = 0, c = 0;
  for (let ch of js) {
    if (ch === '{') o++;
    if (ch === '}') c++;
  }
  console.log('Open:', o, 'Close:', c, 'Diff:', o - c);
}
