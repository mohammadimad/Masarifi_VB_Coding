const fs = require('fs');
const getNav = (file) => {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('<nav ');
  const end = html.indexOf('</nav>', start);
  return html.substring(start, end + 6);
};
console.log('--- INDEX.HTML ---');
console.log(getNav('index.html'));
console.log('--- BUDGET.HTML ---');
console.log(getNav('budget.html'));
console.log('--- REPORTS.HTML ---');
console.log(getNav('reports.html'));
