const fs = require('fs');
const c = fs.readFileSync('F:/scopelock/app.html', 'utf8');
const s = c.indexOf('<script>');
const e = c.indexOf('</script>', s);
const code = c.slice(s, e);

const litCount = code.split('</script>').length - 1;
console.log('Unescaped </script>:', litCount);
console.log('Has isConfigured:', code.includes('isConfigured'));
console.log('Has supabase variable:', code.includes('var supabase'));

const supCount = (code.match(/const\s+supabase\s*=/g) || []).length;
console.log('supabase declarations:', supCount);
console.log('Code length:', code.length);

const idx = code.indexOf('const supabase=');
console.log('supabase index:', idx);
if (idx > 0) {
  console.log('Around supabase:', code.slice(Math.max(0,idx-50), idx+100));
}