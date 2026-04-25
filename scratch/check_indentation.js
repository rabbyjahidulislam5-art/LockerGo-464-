const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes('activeTab ===')) {
        const spaces = line.length - line.trimStart().length;
        console.log(`${i + 1}: [${spaces}] ${line.trim()}`);
    }
    if (line.includes('<AnimatePresence') || line.includes('</AnimatePresence>')) {
        const spaces = line.length - line.trimStart().length;
        console.log(`${i + 1}: [${spaces}] ${line.trim()}`);
    }
});
