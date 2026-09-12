import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Capture the application surface only; documentation and generated output are excluded.
const root = process.cwd();
const [upstreamArg, outputArg] = process.argv.slice(2);
if (!outputArg) throw new Error("Usage: node scripts/capture-baseline.mjs <checkout-or-none> <new-output.json>");
const output = path.resolve(outputArg);
if (existsSync(output)) throw new Error("Refusing to overwrite an existing baseline");
const roots = ["src", "test", "package.json", "package-lock.json", "vite.config.js", "index.html", ".gitignore"];
function inventory(base) {
  const files = {};
  function visit(relative) {
    const absolute = path.join(base, relative);
    if (!existsSync(absolute)) return;
    const directory = readdirSafe(absolute);
    if (directory) {
      for (const entry of directory) visit(`${relative}/${entry}`);
    } else {
      const bytes = readFileSync(absolute);
      files[relative] = {
        sha256: createHash("sha256").update(bytes).digest("hex"),
        normalizedSha256: createHash("sha256").update(bytes.toString("utf8").replace(/\r\n/g, "\n")).digest("hex"),
      };
    }
  }
  function readdirSafe(absolute) {
    try { return readdirSync(absolute).sort(); }
    catch (error) { if (error.code === "ENOTDIR") return null; throw error; }
  }
  roots.forEach(visit);
  return files;
}
const local = inventory(root);
let upstream = null;
let comparison = [];
if (upstreamArg !== "none") {
  const checkout = path.resolve(upstreamArg);
  const git = process.env.GIT_EXECUTABLE || "git";
  const commit = execFileSync(git, ["-c", `safe.directory=${checkout.replaceAll("\\", "/")}`, "-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const files = inventory(checkout);
  upstream = { repository: "https://github.com/ChumponphatRangsee/iron_talon.git", commit, files };
  comparison = [...new Set([...Object.keys(local), ...Object.keys(files)])].sort().map((file) => ({
    file,
    status: !files[file] ? "local-only" : !local[file] ? "upstream-only" :
      local[file].sha256 === files[file].sha256 ? "identical" :
      local[file].normalizedSha256 === files[file].normalizedSha256 ? "line-endings-only" : "modified",
  }));
}
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version, scope: roots, upstream, local, comparison }, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ output, commit: upstream?.commit, comparison }, null, 2));
