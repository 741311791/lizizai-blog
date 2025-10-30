const fs = require('fs');
const path = require('path');

function findRoutes(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes = [];
  
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Route group (auth) doesn't add to URL
      const routeSegment = entry.name.match(/^\(.*\)$/) ? '' : `/${entry.name}`;
      routes.push(...findRoutes(fullPath, base + routeSegment));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
      routes.push(base || '/');
    }
  }
  
  return routes;
}

const routes = findRoutes('./app');
console.log('Found routes:');
routes.sort().forEach(r => console.log(r));
