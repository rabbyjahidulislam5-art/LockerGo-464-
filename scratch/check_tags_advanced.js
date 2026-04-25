import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const tags = line.match(/<(\/?[a-zA-Z0-9.]+)[^>]*>/g);
  if (!tags) continue;

  for (const tag of tags) {
    if (tag.endsWith('/>')) continue;
    const tagNameMatch = tag.match(/<\/?([a-zA-Z0-9.]+)/);
    if (!tagNameMatch) continue;
    const tagName = tagNameMatch[1];
    
    if (tag.startsWith('</')) {
      const last = stack.pop();
      if (last && last.name !== tagName) {
        console.log(`Mismatch at line ${i + 1}: Found </${tagName}> but expected </${last.name}> (opened at line ${last.line})`);
      }
    } else {
      stack.push({ name: tagName, line: i + 1 });
    }
  }
}

console.log("Stack at end:", stack);
