const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');

const openRegex = /<motion\.div/g;
const closeRegex = /<\/motion\.div>/g;

let match;
const opens = [];
while ((match = openRegex.exec(content)) !== null) {
    opens.push(match.index);
}

const closes = [];
while ((match = closeRegex.exec(content)) !== null) {
    closes.push(match.index);
}

console.log(`Opens: ${opens.length}`);
console.log(`Closes: ${closes.length}`);

if (opens.length !== closes.length) {
    console.log("Mismatched motion.div tags!");
}
