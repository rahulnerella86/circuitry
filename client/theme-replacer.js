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
const files = components.filter(f => !f.includes('LandingPage.jsx'));

const replacements = [
  {from: /bg-surface-950/g, to: 'bg-white'},
  {from: /bg-surface-900/g, to: 'bg-surface-50'},
  {from: /text-white/g, to: 'text-surface-900'},
  {from: /text-surface-400/g, to: 'text-surface-600'},
  {from: /text-surface-300/g, to: 'text-surface-700'},
  {from: /border-white\/5/g, to: 'border-surface-200'},
  {from: /border-white\/10/g, to: 'border-surface-300'},
  {from: /bg-white\/5/g, to: 'bg-surface-100'},
  {from: /bg-white\/10/g, to: 'bg-surface-200'},
  {from: /bg-black\/20/g, to: 'bg-surface-100'},
  {from: /bg-black\/10/g, to: 'bg-surface-50'},
  {from: /rgba\(19,19,26,0\.9\)/g, to: 'rgba(255,255,255,0.9)'},
  {from: /rgba\(19,19,26,0\.8\)/g, to: 'rgba(240,240,245,0.8)'},
  {from: /fill="white"/g, to: 'fill="#1a1a24"'},
  {from: /prose-invert/g, to: ''} 
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
