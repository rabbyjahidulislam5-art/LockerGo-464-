import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
let braceCount = 0;
let parenCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') braceCount++;
    else if (line[j] === '}') braceCount--;
    else if (line[j] === '(') parenCount++;
    else if (line[j] === ')') parenCount--;
  }
  if (braceCount < 0 || parenCount < 0) {
    console.log(`Error at line ${i + 1}: Braces=${braceCount}, Parens=${parenCount}`);
    break;
  }
}

console.log(`Final: Braces=${braceCount}, Parens=${parenCount}`);
