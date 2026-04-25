import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
const stack = [];
const tags = content.match(/<(\/?[a-zA-Z0-9.]+)[^>]*>/g);

if (!tags) {
  console.log("No tags found");
  process.exit(0);
}

for (const tag of tags) {
  if (tag.endsWith('/>')) continue; // Self-closing
  const tagNameMatch = tag.match(/<\/?([a-zA-Z0-9.]+)/);
  if (!tagNameMatch) continue;
  const tagName = tagNameMatch[1];
  
  if (tag.startsWith('</')) {
    const last = stack.pop();
    if (last !== tagName) {
      console.log(`Mismatch: Found </${tagName}> but expected </${last}>`);
    }
  } else {
    stack.push(tagName);
  }
}

console.log("Stack at end:", stack);
