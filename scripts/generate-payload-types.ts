import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const payloadPath = path.resolve(root, "..", "lifevault-api", "docs", "payloads.json");
const outDir = path.resolve(root, "lib", "generated");
const outFile = path.resolve(outDir, "payloadTypes.ts");

const raw = fs.readFileSync(payloadPath, "utf-8");
const json = JSON.parse(raw);

const header = `// AUTO-GENERATED. DO NOT EDIT.\n// Source: ${payloadPath}\n\n`;
const body = `export const payloadShapes = ${JSON.stringify(json, null, 2)} as const;\n\n` +
  `export type PayloadRecordType = keyof typeof payloadShapes;\n\n` +
  `export type PayloadShapeMap = typeof payloadShapes;\n\n` +
  `export type PayloadFor<T extends PayloadRecordType> = PayloadShapeMap[T];\n`;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, header + body, "utf-8");
console.log(`Wrote ${outFile}`);
