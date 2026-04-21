import fs from 'fs';
let content = fs.readFileSync('single-file-index.html', 'utf-8');
content = content.replace(/copyright:"[^"]+",license:"[^"]+",source:"[^"]+"/g, 'copyright:"",license:"",source:""');
fs.writeFileSync('single-file-index.html', content);
console.log('Removed core-js license strings');




