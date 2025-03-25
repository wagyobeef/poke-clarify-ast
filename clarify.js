const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const decodeHex = require("./steps/decode-hex");

const inputFile = process.argv[2];

const steps = [{ name: "decode-hex", action: decodeHex }];

if (!inputFile) {
  console.error("Error: No input file provided.");
  console.log("Usage: node clarify.js <filename>");
  process.exit(1);
}

const filePath = path.resolve(__dirname, "captchas", inputFile);

// Load input HTML
let html;
try {
  html = fs.readFileSync(filePath, "utf-8");
} catch {
  console.error("❌ Failed to read input HTML.");
  process.exit(1);
}

// Load last completed step
let lastCompletedStep = null;
try {
  lastCompletedStep = fs.readFileSync("last-step.txt", "utf-8").trim();
} catch {
  console.log("No previous step found. Starting from the beginning.");
}

// Determine starting point
let startIndex = 0;
if (lastCompletedStep) {
  startIndex = steps.findIndex((s) => s.name === lastCompletedStep);
  if (startIndex === -1) {
    console.error(`❌ Step "${lastCompletedStep}" not found.`);
    process.exit(1);
  }
  startIndex++; // Continue from the next step
}

for (let i = startIndex; i < steps.length; i++) {
  const { name, action } = steps[i];

  const $ = cheerio.load(html);
  const scriptTag = $("script").first();
  if (!scriptTag.length) {
    console.error(`❌ No <script> tag found in HTML.`);
    process.exit(1);
  }

  const originalScript = scriptTag.html();
  const modifiedScript = action(originalScript);
  scriptTag.html(modifiedScript);

  const updatedHTML = $.html();
  const outputPath = path.join(__dirname, "temp", `${name}.html`);
  fs.writeFileSync(outputPath, updatedHTML, "utf-8");

  fs.writeFileSync("last-step.txt", name, "utf-8");
  console.log(`✅ Completed step "${name}" → saved to ${outputPath}`);

  html = updatedHTML; // Carry forward for next step
}
