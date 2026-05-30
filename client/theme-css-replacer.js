import fs from 'fs';
import path from 'path';

const cssFile = path.join(process.cwd(), 'src', 'index.css');

let content = fs.readFileSync(cssFile, 'utf-8');

// Replace specific root CSS variables
content = content.replace(/--gradient-primary:.*/, '--gradient-primary: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%);');
content = content.replace(/--gradient-dark:.*/, '--gradient-dark: linear-gradient(180deg, #09090b 0%, #000000 100%);');
content = content.replace(/--glass-bg:.*/, '--glass-bg: rgba(0, 0, 0, 0.6);');
content = content.replace(/--glass-border:.*/, '--glass-border: rgba(255, 255, 255, 0.1);');
content = content.replace(/--glass-shadow:.*/, '--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);');

// Body color
content = content.replace(/color: #1a1a24;/, 'color: #e4e4e7;');

// Replace rgba blues with rgba reds (using 220, 38, 38 which is roughly dc2626)
content = content.replace(/rgba\(42, 139, 255, /g, 'rgba(220, 38, 38, ');
content = content.replace(/rgba\(19, 19, 26, /g, 'rgba(255, 255, 255, '); // track background
content = content.replace(/rgba\(0, 0, 0, 0\.04\)/g, 'rgba(255, 255, 255, 0.04)'); // chip background
content = content.replace(/rgba\(0, 0, 0, 0\.08\)/g, 'rgba(255, 255, 255, 0.08)'); // chip border

// Replace hex blues with hex reds
content = content.replace(/#2a8bff/g, '#dc2626');
content = content.replace(/#1360f5/g, '#b91c1c');
content = content.replace(/#0c4ee1/g, '#ef4444');

fs.writeFileSync(cssFile, content);
console.log('Updated index.css');
