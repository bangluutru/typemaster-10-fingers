import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leftPath = path.join(__dirname, 'left.svg');
const leftContent = fs.readFileSync(leftPath, 'utf8');

// A path looks like: <path d="..." fill="..." transform="translate(x,y)"/>
// Let's extract all paths and their translates and fills
const pathRegex = /<path d="([^"]+)" fill="([^"]+)"(?: transform="translate\(([^,]+),([^)]+)\)")?/g;

let match;
let index = 0;
while ((match = pathRegex.exec(leftContent)) !== null) {
  const d = match[1];
  const fill = match[2];
  const tx = parseFloat(match[3] || '0');
  const ty = parseFloat(match[4] || '0');

  // Let's parse the path commands to find the min/max X and Y (bounding box)
  // We can do a simple parsing of numbers in the 'd' attribute
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

  console.log(`Path ${index}: fill=${fill}, translate=(${tx}, ${ty})`);
  console.log(`  Bounding Box: X=[${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
  console.log(`  Center: (${((minX + maxX)/2).toFixed(1)}, ${((minY + maxY)/2).toFixed(1)})`);
  index++;
}
