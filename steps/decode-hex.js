const { Project } = require("ts-morph");

module.exports = function decodeHex(code) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("decode-hex.js", code, {
    overwrite: true,
  });

  let count = 0;

  sourceFile.forEachDescendant((node) => {
    if (node.getKindName() === "StringLiteral") {
      const text = node.getText(); // includes quotes
      const unquoted = text.slice(1, -1);

      if (/\\x[0-9a-fA-F]{2}/.test(unquoted)) {
        try {
          const decoded = unquoted.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          );
          node.replaceWithText(JSON.stringify(decoded));
          count++;

          // Update progress on the same line
          process.stdout.write(`\rHexes decoded: ${count}`);
        } catch (e) {
          console.warn(`⚠️ Failed to decode string: ${unquoted}`);
        }
      }
    }
  });

  console.log(); // newline after final count
  return sourceFile.getFullText();
};
