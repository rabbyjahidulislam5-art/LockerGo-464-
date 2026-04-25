import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple regex to find <motion.div and </motion.div>
  const openings = line.match(/<motion\.div/g);
  const closings = line.match(/<\/motion\.div>/g);
  const selfClosings = line.match(/<motion\.div[^>]*\/>/g);

  const numOpen = (openings ? openings.length : 0) - (selfClosings ? selfClosings.length : 0);
  const numClose = (closings ? closings.length : 0);

  for (let j = 0; j < numOpen; j++) {
    stack.push(i + 1);
  }
  for (let j = 0; j < numClose; j++) {
    stack.pop();
  }
}

console.log("Unclosed motion.div opened at lines:", stack);
