const fs = require('fs');
const h = fs.readFileSync('app.html').toString();
const m = h.match(/type="text\/babel">([\s\S]*?)<\/script>/);
if (m) {
  const js = m[1];
  let o = 0, c = 0;
  for (let ch of js) {
    if (ch === '{') o++;
    if (ch === '}') c++;
  }
  console.log('Open:', o, 'Close:', c, 'Diff:', o - c);
}
