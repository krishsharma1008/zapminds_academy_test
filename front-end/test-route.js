// Quick test to verify route structure
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const dashboardIndex = path.join(pagesDir, 'dashboard', 'index.vue');

if (fs.existsSync(dashboardIndex)) {
  console.log('✓ Dashboard route file exists:', dashboardIndex);
  const stats = fs.statSync(dashboardIndex);
  console.log('  Size:', stats.size, 'bytes');
  console.log('  Modified:', stats.mtime);
} else {
  console.log('✗ Dashboard route file NOT found');
}

// List all pages
console.log('\nAll page routes:');
function listPages(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      listPages(fullPath, prefix + item + '/');
    } else if (item.endsWith('.vue')) {
      console.log('  /' + prefix + item.replace('.vue', ''));
    }
  });
}
listPages(pagesDir);
