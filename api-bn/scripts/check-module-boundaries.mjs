#!/usr/bin/env node
// CLI tipis di atas `scripts/lib/analyze-module-boundaries.mjs`.
// Jalankan lewat `npm run arch:check`. Logikanya sendiri juga dites lewat
// vitest di `test/architecture.test.ts` (import langsung, tanpa spawn proses).

import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeModuleBoundaries } from "./lib/analyze-module-boundaries.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { filesChecked, boundaryViolations, cycles, moduleGraph } = analyzeModuleBoundaries({ rootDir: ROOT });

let hasError = false;

if (boundaryViolations.length > 0) {
  hasError = true;
  console.error(`\n✖ ${boundaryViolations.length} pelanggaran boundary antar-module:\n`);
  for (const v of boundaryViolations) {
    console.error(
      `  [${v.fromModule} -> ${v.toModule}] ${v.from}\n` +
      `    mengimpor internal module lain secara langsung: ${v.to}\n` +
      `    -> gunakan #app/ports + Orchestrator, atau barrel publik '#${v.toModule}'.\n`
    );
  }
}

if (cycles.length > 0) {
  hasError = true;
  console.error(`\n✖ ${cycles.length} circular dependency antar-module bisnis ditemukan:\n`);
  for (const cycle of cycles) {
    const ring = [...cycle, cycle[0]];
    console.error(`  ${ring.join(" -> ")}`);
    for (let i = 0; i < cycle.length; i++) {
      const a = ring[i];
      const b = ring[i + 1];
      const example = moduleGraph.get(a)?.get(b);
      if (example) console.error(`    ${a} -> ${b}: contoh ${example.from} -> ${example.to}`);
    }
    console.error("");
  }
}

if (hasError) {
  console.error(`Total file dicek: ${filesChecked}\n`);
  process.exit(1);
}

console.log(`✔ Boundary antar-module aman, tidak ada circular import (${filesChecked} file dicek).`);
