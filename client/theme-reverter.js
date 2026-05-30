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

// Use process.cwd() assuming we run from client directory
const componentsDir = path.join(process.cwd(), 'src', 'components');
const components = walkSync(componentsDir, []);
components.push(path.join(process.cwd(), 'src', 'App.jsx'));
const files = components;

const replacements = [
  {to: 'bg-surface-950', from: /bg-white/g},
  {to: 'bg-surface-900', from: /bg-surface-50/g},
  {to: 'text-white', from: /text-surface-900/g},
  {to: 'text-surface-400', from: /text-surface-600/g},
  {to: 'text-surface-300', from: /text-surface-700/g},
  {to: 'border-white/5', from: /border-surface-200/g},
  {to: 'border-white/10', from: /border-surface-300/g},
  {to: 'bg-white/5', from: /bg-surface-100/g},
  {to: 'bg-white/10', from: /bg-surface-200/g},
  {to: 'rgba(19,19,26,0.9)', from: /rgba\(255,255,255,0\.9\)/g},
  {to: 'rgba(19,19,26,0.8)', from: /rgba\(240,240,245,0\.8\)/g},
  {to: 'fill="white"', from: /fill="#1a1a24"/g}
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Updated: ' + f);
  }
});
