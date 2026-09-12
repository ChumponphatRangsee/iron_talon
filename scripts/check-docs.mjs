import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const documents = ["README.md", "AGENTS.md"];
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (file.endsWith(".md") && entry.name !== "Iron_Talon_7_Player_Game_Design.md") documents.push(file);
  }
}
collect("docs");
const errors = [];
for (const file of documents) {
  const source = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const destination = path.resolve(root, path.dirname(file), decodeURIComponent(target.split("#")[0]));
    if (!existsSync(destination)) errors.push(`${file}: missing ${target}`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Verified local inline-link file targets in ${documents.length} authored Markdown files.`);
