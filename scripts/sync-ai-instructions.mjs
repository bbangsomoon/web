import { copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const instructionFiles = ["AGENTS.md", "CLAUDE.md"];
const projectRoot = process.cwd();

for (const file of instructionFiles) {
  const source = path.join(projectRoot, "config", file);
  const destination = path.join(projectRoot, file);

  try {
    await access(source, constants.R_OK);
    await copyFile(source, destination);
    process.stdout.write(`Synced ${file}\n`);
  } catch {
    process.stderr.write(`Skipped ${file}: config source not found\n`);
  }
}
