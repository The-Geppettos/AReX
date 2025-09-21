const fs = require("fs");
const path = require("path");

const DIST_DIR = path.resolve(__dirname, "dist");
const LOG_PREFIX = "[clean]";

if (fs.existsSync(DIST_DIR)) {
  try {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error while deleting ${DIST_DIR}:`, error);
  }
  console.info(`${LOG_PREFIX} Cleaned up ${DIST_DIR}`);
} else {
  console.info(
    `${LOG_PREFIX} File or directory ${DIST_DIR} does not exist. Nothing to clean up.`,
  );
}
