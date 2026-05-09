import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = fs.realpathSync.native(process.cwd());
const nextBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

const result = spawnSync(nextBin, ["build", "frontend"], {
  cwd: rootDir,
  env: {
    ...process.env,
    INIT_CWD: rootDir,
    PWD: rootDir,
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
