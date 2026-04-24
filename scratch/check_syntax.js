import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  else if (content[i] === '}') braceCount--;
  else if (content[i] === '(') parenCount++;
  else if (content[i] === ')') parenCount--;
  else if (content[i] === '[') bracketCount++;
  else if (content[i] === ']') bracketCount--;
}

console.log(`Braces: ${braceCount}`);
console.log(`Parens: ${parenCount}`);
console.log(`Brackets: ${bracketCount}`);
