import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leftPath = path.join(__dirname, 'left.svg');
const leftContent = fs.readFileSync(leftPath, 'utf8');

const pathRegex = /<path d="([^"]+)" fill="([^"]+)"(?: transform="translate\(([^,]+),([^)]+)\)")?/g;

let match;
let paths = [];
while ((match = pathRegex.exec(leftContent)) !== null) {
  const d = match[1];
  const fill = match[2];
  const tx = parseFloat(match[3] || '0');
  const ty = parseFloat(match[4] || '0');

  const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g).map(parseFloat);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      const x = coords[i] + tx;
      const y = coords[i+1] + ty;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  paths.push({
    fill,
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  });
}

// Find paths representing the fingers. They are long (height > 100) and narrow (width < 250).
console.log('--- Potential Finger Outline Paths ---');
const fingers = paths.filter(p => p.height > 100 && p.width < 250 && p.fill !== 'none');
// Sort fingers by centerX left-to-right
fingers.sort((a, b) => a.centerX - b.centerX);
fingers.forEach((p, i) => {
  console.log(`Finger ${i}: Center=(${p.centerX.toFixed(1)}, ${p.centerY.toFixed(1)}), BBox: X=[${p.minX.toFixed(1)}, ${p.maxX.toFixed(1)}], Y=[${p.minY.toFixed(1)}, ${p.maxY.toFixed(1)}], fill=${p.fill}, W=${p.width.toFixed(1)}, H=${p.height.toFixed(1)}`);
});
