const { execSync } = require('child_process');
const commits = execSync('git log --pretty=format:"%h"').toString().split('\n');
for (const commit of commits) {
    if (!commit) continue;
    try {
        const fileContent = execSync(`git show ${commit}:src/components/ActiveTrades.tsx`, { encoding: 'utf8', stdio: 'pipe' });
        if (fileContent.includes('Open Lots') || fileContent.includes('دفعات')) {
            console.log(`Found in commit: ${commit}`);
            break;
        }
    } catch (e) {
        // file might not exist in that commit
    }
}
