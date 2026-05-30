import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'components', 'CircuitDiagram.jsx');
let content = fs.readFileSync(file, 'utf-8');

// Replace backgrounds
content = content.replace(/rgba\(42,139,255,0\.03\)/g, 'rgba(220,38,38,0.05)');
content = content.replace(/rgba\(19,19,26,0\.8\)/g, 'rgba(0,0,0,1)');
content = content.replace(/rgba\(240,240,245,0\.8\)/g, 'rgba(0,0,0,1)');

// Grid colors
content = content.replace(/rgba\(0,0,0,0\.04\)/g, 'rgba(255,255,255,0.05)');
content = content.replace(/rgba\(255,255,255,0\.02\)/g, 'rgba(255,255,255,0.05)');

// Base component strokes (blue to red)
content = content.replace(/#6366f1/g, '#dc2626'); // Indigo to Red 600
content = content.replace(/#8b5cf6/g, '#b91c1c'); // Violet to Red 700
content = content.replace(/#3b82f6/g, '#ef4444'); // Blue to Red 500
content = content.replace(/#06b6d4/g, '#dc2626'); // Cyan to Red 600
content = content.replace(/#10b981/g, '#22c55e'); // Green remains (maybe adjusting slight hue)

fs.writeFileSync(file, content);
console.log('Updated CircuitDiagram.jsx colors');
