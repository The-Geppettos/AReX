const fs = require("fs");

const arg = process.argv.slice(2)[0];

if (!arg) {
  console.error("Please provide a file path as an argument.");
  process.exit(1);
}

const filePath = arg;

if (fs.existsSync(filePath)) {
  fs.rmSync(filePath, { recursive: true, force: true });
  console.log(`Cleaned up ${filePath}`);
} else {
  console.log(
    `File or directory ${filePath} does not exist. Nothing to clean up.`,
  );
}
