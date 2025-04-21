// Script to generate placeholder icon files for the extension
const fs = require('fs');
const { createCanvas } = require('canvas');

// If canvas is not available, we'll use a more basic approach
function generateBasicIconsWithoutCanvas() {
  // Function to create a simple 1x1 pixel PNG
  function createPNG(size, fileName) {
    // PNG header and IHDR chunk for a 1x1 colored pixel
    // Color: #6366f1 (purple, matching our brand)
    const header = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // "IHDR"
      0x00, 0x00, 0x00, size >> 8, 0x00, 0x00, 0x00, size & 0xFF, // Width
      0x00, 0x00, 0x00, size >> 8, 0x00, 0x00, 0x00, size & 0xFF, // Height
      0x08, // Bit depth
      0x06, // Color type (RGBA)
      0x00, // Compression method
      0x00, // Filter method
      0x00, // Interlace method
      0x00, 0x00, 0x00, 0x00, // CRC-32 placeholder
    ]);

    // Create a very simple IDAT chunk with data for a 1x1 purple pixel
    const totalSize = size * size;
    const data = Buffer.alloc(totalSize * 4 + totalSize); // 4 bytes per pixel + filter byte per row
    
    // Fill with purple pixels
    for (let i = 0; i < totalSize; i++) {
      const offset = i * 4 + Math.floor(i / size) + 1; // +1 for filter byte at start of each row
      data[offset] = 0x63; // R
      data[offset + 1] = 0x66; // G
      data[offset + 2] = 0xF1; // B
      data[offset + 3] = 0xFF; // A (fully opaque)
    }

    // IDAT chunk
    const idatHeader = Buffer.from([
      0x00, 0x00, 0x00, data.length, // Length
      0x49, 0x44, 0x41, 0x54, // "IDAT"
    ]);

    const idatFooter = Buffer.from([
      0x00, 0x00, 0x00, 0x00, // CRC-32 placeholder
    ]);

    // IEND chunk
    const iend = Buffer.from([
      0x00, 0x00, 0x00, 0x00, // Length
      0x49, 0x45, 0x4E, 0x44, // "IEND"
      0xAE, 0x42, 0x60, 0x82, // CRC-32
    ]);

    // Combine all parts
    const png = Buffer.concat([header, idatHeader, data, idatFooter, iend]);
    
    // Write to file
    fs.writeFileSync(fileName, png);
    console.log(`Created ${fileName}`);
  }

  // Generate icons
  const sizes = [16, 32, 48, 128];
  const directory = './images/';
  
  sizes.forEach(size => {
    createPNG(size, `${directory}icon-${size}.png`);
  });
}

// Main function to generate icons
function generateIcons() {
  console.log('Generating icon files...');
  
  try {
    // Make sure images directory exists
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images');
    }
    
    // Try using canvas module if available
    if (typeof createCanvas === 'function') {
      generateIconsWithCanvas();
    } else {
      // Fallback to basic approach
      generateBasicIconsWithoutCanvas();
    }
    
    console.log('Icon generation complete!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Generate icons with the canvas module if available
function generateIconsWithCanvas() {
  const sizes = [16, 32, 48, 128];
  
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fill with gradient matching our extension's theme
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add "L" text for larger icons
    if (size >= 32) {
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(size * 0.6)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L', size / 2, size / 2);
    }
    
    // Save to file
    const buffer = canvas.toBuffer();
    fs.writeFileSync(`./images/icon-${size}.png`, buffer);
    console.log(`Created icon-${size}.png`);
  });
}

// Run the generator
generateIcons();
