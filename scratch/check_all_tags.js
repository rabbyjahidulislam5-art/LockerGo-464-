const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/AdminDashboard.tsx', 'utf8');

function checkTags(tagName) {
    const openRegex = new RegExp('<' + tagName + '[^>]*[^/]>', 'g');
    const closeRegex = new RegExp('</' + tagName + '>', 'g');
    const selfClosingRegex = new RegExp('<' + tagName + '[^>]*/>', 'g');

    const opens = content.match(openRegex) || [];
    const closes = content.match(closeRegex) || [];
    const selfClosings = content.match(selfClosingRegex) || [];

    console.log(`${tagName}: Opens=${opens.length}, Closes=${closes.length}, SelfClosings=${selfClosings.length}`);
    if (opens.length !== closes.length) {
        console.log(`MISMATCH in ${tagName}!`);
    }
}

['div', 'main', 'AnimatePresence', 'motion.div', 'Card', 'CardHeader', 'CardContent', 'CardTitle', 'CardDescription', 'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription'].forEach(checkTags);
