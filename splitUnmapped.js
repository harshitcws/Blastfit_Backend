// splitUnmapped.js
const fs = require('fs');
const path = require('path');

// Paths
const inputFile = path.join(__dirname, 'unmappedExercises.json');
const outputDir = path.join(__dirname, 'exercise_batches');

// Ensure output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
  console.log(`📂 Created folder: ${outputDir}`);
}

// Load full unmapped file
const all = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Split into chunks of 100
const chunkSize = 100;
const total = all.length;

for (let i = 0; i < total; i += chunkSize) {
  const chunk = all.slice(i, i + chunkSize);
  const fileName = `batch${Math.floor(i / chunkSize) + 1}.json`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(chunk, null, 2), 'utf8');
  console.log(`✅ Wrote ${filePath} (${chunk.length} records)`);
}

console.log(`🎉 Done! Split ${total} exercises into ${Math.ceil(total / chunkSize)} files.`);
