const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');

function checkTags(tagName) {
    // Escape dots in tag names like motion.div
    const escapedTagName = tagName.replace('.', '\\.');
    
    // Improved regex to handle multiline tags
    const openRegex = new RegExp('<' + escapedTagName + '(\\s+[^>]*[^/]|\\s*)>', 'g');
    const closeRegex = new RegExp('</' + escapedTagName + '>', 'g');
    const selfClosingRegex = new RegExp('<' + escapedTagName + '[^>]*/>', 'g');

    const opens = content.match(openRegex) || [];
    const closes = content.match(closeRegex) || [];
    const selfClosings = content.match(selfClosingRegex) || [];

    console.log(`${tagName}: Opens=${opens.length}, Closes=${closes.length}, SelfClosings=${selfClosings.length}`);
}

['AnimatePresence', 'motion.div', 'main'].forEach(checkTags);
