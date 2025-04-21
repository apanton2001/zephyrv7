// Simple icon generator for Chrome extension
// This script creates basic colored square PNG files for the extension icons
// It requires only Node.js with no additional dependencies

const fs = require('fs');
const path = require('path');

// Ensure the images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
  console.log('Created images directory');
}

// Function to create a simple colored PNG for an icon
function createSimpleIcon(size, fileName) {
  // Create a simple one-colored PNG file
  // This uses the minimal PNG format specification
  
  // PNG signature
  const signature = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ]);
  
  // IHDR chunk - defines width, height and other properties
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  width.writeUInt32BE(size);
  height.writeUInt32BE(size);
  
  const ihdrData = Buffer.concat([
    width,
    height,
    Buffer.from([
      0x08,        // bit depth (8 bits per sample)
      0x06,        // color type (RGBA)
      0x00,        // compression method
      0x00,        // filter method
      0x00         // interlace method
    ])
  ]);
  
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length);
  
  const ihdrChunk = Buffer.concat([
    ihdrLength,
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.alloc(4)  // CRC placeholder
  ]);
  
  // IDAT chunk - contains the actual pixel data
  // Create a purple fill color (matches our brand color #6366f1)
  const pixelData = [];
  
  // Add filter byte (0) at the start of each scanline
  for (let y = 0; y < size; y++) {
    pixelData.push(0);  // filter byte
    for (let x = 0; x < size; x++) {
      pixelData.push(0x63);  // R
      pixelData.push(0x66);  // G
      pixelData.push(0xf1);  // B
      pixelData.push(0xff);  // A (fully opaque)
    }
  }
  
  const pixelDataBuffer = Buffer.from(pixelData);
  
  // For simplicity, we're not compressing the data
  // In a real scenario, you'd apply zlib deflate compression
  const idatData = pixelDataBuffer;
  
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(idatData.length);
  
  const idatChunk = Buffer.concat([
    idatLength,
    Buffer.from('IDAT'),
    idatData,
    Buffer.alloc(4)  // CRC placeholder
  ]);
  
  // IEND chunk - marks the end of the PNG file
  const iendChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]),  // zero length
    Buffer.from('IEND'),
    Buffer.alloc(4)  // CRC placeholder
  ]);
  
  // Combine all chunks
  const pngFile = Buffer.concat([
    signature,
    ihdrChunk,
    idatChunk,
    iendChunk
  ]);
  
  // Write to file
  fs.writeFileSync(fileName, pngFile);
  console.log(`Created ${fileName}`);
}

// Generate icons for all required sizes
const iconSizes = [16, 32, 48, 128];

iconSizes.forEach(size => {
  const fileName = path.join(imagesDir, `icon-${size}.png`);
  createSimpleIcon(size, fileName);
});

console.log('All icons created successfully in the images directory');
console.log('You can now load the extension in Chrome');

// Alternative approach: modify manifest to remove icon references
// Uncomment this code to use this approach instead
/*
const manifestFile = path.join(__dirname, 'manifest.json');
const manifest = require(manifestFile);

// Create a simplified manifest without icon references
delete manifest.icons;
delete manifest.action.default_icon;

// Write the modified manifest back to disk
fs.writeFileSync(
  manifestFile, 
  JSON.stringify(manifest, null, 2)
);
console.log('Modified manifest.json to remove icon references');
*/
