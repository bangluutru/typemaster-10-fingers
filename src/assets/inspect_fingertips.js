import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leftPath = path.join(__dirname, 'left.svg');
const leftContent = fs.readFileSync(leftPath, 'utf8');

// Path matching regex
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
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  });
}

// Filter paths that correspond to the fingertip regions.
// In the SVG, the fingertips have smaller Y coordinates (near the top of the SVG).
// Let's sort the paths by minY to see the highest elements (fingertips).
console.log('--- Top 30 Highest Paths (potential fingertips) ---');
const sortedPaths = [...paths].sort((a, b) => a.minY - b.minY);
for (let i = 0; i < Math.min(sortedPaths.length, 30); i++) {
  const p = sortedPaths[i];
  console.log(`minY=${p.minY.toFixed(1)}, maxY=${p.maxY.toFixed(1)}, minX=${p.minX.toFixed(1)}, maxX=${p.maxX.toFixed(1)}, fill=${p.fill}`);
  console.log(`  Center: (${p.centerX.toFixed(1)}, ${p.centerY.toFixed(1)})`);
}
