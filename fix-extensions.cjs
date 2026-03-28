const fs = require('fs');
const path = require('path');

function replaceExtensions(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Regex to find paths starting with /img/ or /skills/
  const regex = /(url\s*:\s*['\"]|url\"?\s*:\s*\"|\"logo\"\s*:\s*\"|\"image\"\s*:\s*\"|\"images\"\s*:\s*\[\s*\"|\"popupImages\"\s*:\s*\[\s*\"|[\[\s,]*\")(\/(?:img|skills)\/[^.'\"]+)\.([a-zA-Z0-9]+)(['\"])/g;
  
  content = content.replace(regex, (match, prefix, p1, oldExt, suffix) => {
    const dir = path.join(process.cwd(), 'public', path.dirname(p1));
    const basename = path.basename(p1);
    
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const actualFile = files.find(f => {
        const ext = path.extname(f);
        return f === basename + ext;
      });
      if (actualFile) {
        let newExt = path.extname(actualFile).replace('.', '');
        if (newExt !== oldExt) {
            changes++;
            return prefix + p1 + '.' + newExt + suffix;
        }
      }
    }
    return match;
  });

  if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${changes} extensions in ${filePath}`);
  }
}

replaceExtensions('src/data/skills.json');
replaceExtensions('src/data/career.json');
replaceExtensions('src/data/education.json');
replaceExtensions('src/components/SwipeCards.tsx');
console.log('Done!');
