import fs from "fs";

const sourceEnvPath = "../.env";
const targetEnvPath = "./.env";

fs.copyFileSync(sourceEnvPath, targetEnvPath);
console.log(`Copied ${sourceEnvPath} to ${targetEnvPath}`);
