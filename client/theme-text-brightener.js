import fs from 'fs';
import path from 'path';

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const componentsDir = path.join(process.cwd(), 'src', 'components');
const components = walkSync(componentsDir, []);
components.push(path.join(process.cwd(), 'src', 'App.jsx'));

const replacements = [
  // Tailwind text colors
  {from: /text-surface-500/g, to: 'text-surface-300'},
  {from: /text-surface-400/g, to: 'text-surface-200'},
  {from: /text-primary-400/g, to: 'text-primary-300'}, // Make active tabs pop more
  {from: /text-surface-600/g, to: 'text-surface-400'},
  // SVG text colors in CircuitDiagram
  {from: /fill="#64748b"/g, to: 'fill="#e5e5e5"'}, // node name
  {from: /fill="#0f172a"/g, to: 'fill="#ffffff"'}, // node value
  {from: /fill="#6b7280"/g, to: 'fill="#9ca3af"'}, // GND / gray rails
];

components.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Brightened text in: ' + f);
  }
});
