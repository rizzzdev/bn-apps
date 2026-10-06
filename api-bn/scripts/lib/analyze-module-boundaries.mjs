// =============================================================================
//  analyze-module-boundaries.mjs
// =============================================================================
// Logika inti (importable, testable) untuk menegakkan dua aturan arsitektur
// modular monolith repo ini:
//
//  1. Boundary antar-module bisnis (academic, auth, exam, internship, learn,
//     master): satu module TIDAK BOLEH mengimpor langsung internal module
//     lain (`src/<module>/src/{modules,middlewares,database,routes}/**`).
//     Akses lintas-module hanya sah lewat:
//       - barrel publik module lain (`#<module>` / `<module>/index.ts`) —
//         dipakai untuk router mounting & shared middleware (`sentriAuth`);
//       - `src/<module>/src/services/*-data.service.ts` — satu-satunya
//         "port implementation" yang boleh diakses module lain, langsung
//         atau lewat Orchestrator (`src/app/orchestrator.ts`).
//
//  2. Tidak boleh ada circular dependency ANTAR-MODULE BISNIS (dicek di level
//     module, bukan file — lihat komentar di `analyzeModuleBoundaries` untuk
//     alasannya).
//
// Ditulis tanpa bergantung pada compiler TypeScript pihak ketiga (regex-based
// import extraction) karena tooling seperti dependency-cruiser belum
// mendukung TypeScript 7 yang dipakai project ini.
// =============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export const BUSINESS_MODULES = ["academic", "auth", "exam", "internship", "learn", "master"];
const FORBIDDEN_INTERNAL_RE = /^src\/(academic|auth|exam|internship|learn|master)\/src\/(modules|middlewares|database|routes)\//;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "generated" || entry === "migrations") continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

const toPosix = (p) => p.split(path.sep).join("/");

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)(?:[^'"();]*?)from\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractSpecifiers(source) {
  const specs = new Set();
  for (const re of [IMPORT_RE, BARE_IMPORT_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) specs.add(m[1]);
  }
  return [...specs];
}

function stripJsExt(p) {
  return p.endsWith(".js") ? p.slice(0, -3) : p;
}

export function moduleOf(relPath) {
  const m = relPath.match(/^src\/(academic|auth|exam|internship|learn|master)\//);
  return m ? m[1] : null;
}

function canonicalizeCycle(nodes) {
  let minIdx = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i] < nodes[minIdx]) minIdx = i;
  }
  return [...nodes.slice(minIdx), ...nodes.slice(0, minIdx)];
}

/**
 * @param {{ rootDir: string }} opts - root project directory (berisi package.json & src/)
 */
export function analyzeModuleBoundaries({ rootDir }) {
  const srcDir = path.join(rootDir, "src");
  const pkg = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const importAliases = pkg.imports ?? {};

  const allFiles = walk(srcDir);
  const toRepoRel = (absPath) => toPosix(path.relative(rootDir, absPath));
  const fileSet = new Set(allFiles.map(toRepoRel));

  function tryResolveOnDisk(relNoExt) {
    const candidates = [relNoExt, `${relNoExt}.ts`, `${relNoExt}/index.ts`];
    for (const c of candidates) {
      const norm = toPosix(path.normalize(c));
      if (fileSet.has(norm)) return norm;
    }
    return null;
  }

  function resolveAlias(specifier) {
    if (importAliases[specifier]) {
      return stripJsExt(toPosix(path.normalize(importAliases[specifier])));
    }
    for (const [pattern, target] of Object.entries(importAliases)) {
      if (!pattern.endsWith("/*")) continue;
      const prefix = pattern.slice(0, -1);
      if (specifier.startsWith(prefix)) {
        const rest = specifier.slice(prefix.length);
        return stripJsExt(toPosix(path.normalize(target.replace("*", rest))));
      }
    }
    return null;
  }

  function resolveSpecifier(fromFileRepoRel, specifier) {
    if (specifier.startsWith("#")) {
      const aliasTarget = resolveAlias(specifier);
      return aliasTarget ? tryResolveOnDisk(aliasTarget) : null;
    }
    if (specifier.startsWith(".")) {
      const fromDir = path.dirname(fromFileRepoRel);
      const joined = toPosix(path.normalize(path.join(fromDir, specifier)));
      return tryResolveOnDisk(stripJsExt(joined));
    }
    return null; // bare package import (node_modules) - di luar cakupan pemeriksaan ini
  }

  // -- bangun graph import antar-file ---------------------------------------
  const graph = new Map();
  for (const absPath of allFiles) {
    const rel = toRepoRel(absPath);
    const source = readFileSync(absPath, "utf8");
    const resolved = new Set();
    for (const spec of extractSpecifiers(source)) {
      const target = resolveSpecifier(rel, spec);
      if (target && target !== rel) resolved.add(target);
    }
    graph.set(rel, resolved);
  }

  // -- rule 1: boundary antar-module -----------------------------------------
  const boundaryViolations = [];
  for (const [from, targets] of graph) {
    const fromModule = moduleOf(from);
    if (!fromModule) continue;
    for (const to of targets) {
      if (!FORBIDDEN_INTERNAL_RE.test(to)) continue;
      const toModule = moduleOf(to);
      if (toModule && toModule !== fromModule) {
        boundaryViolations.push({ from, to, fromModule, toModule });
      }
    }
  }

  // -- rule 2: no circular dependency antar-module bisnis --------------------
  // Sengaja dicek di level module (bukan level file): `src/app/index.ts` adalah
  // composition root yang secara sah mengimpor SEMUA module (untuk memasang
  // router) sekaligus jadi shared-kernel barrel yang diimpor SEMUA module
  // (untuk util/error/response helper) — itu membuat hampir tiap file
  // "bersiklus" lewat app di level file, bukan masalah nyata (hub yang
  // disengaja). Yang ingin dicegah: dua module BISNIS saling bergantung
  // (peer-to-peer), seperti kasus lama auth <-> master.
  const moduleGraph = new Map(BUSINESS_MODULES.map((m) => [m, new Map()]));
  for (const [from, targets] of graph) {
    const fromModule = moduleOf(from);
    if (!fromModule) continue;
    for (const to of targets) {
      const toModule = moduleOf(to);
      if (!toModule || toModule === fromModule) continue;
      const edges = moduleGraph.get(fromModule);
      if (!edges.has(toModule)) edges.set(toModule, { from, to });
    }
  }

  const cycles = [];
  const seenCycleKeys = new Set();
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();

  function dfsModules(node, stack) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of moduleGraph.get(node)?.keys() ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === WHITE) {
        dfsModules(next, stack);
      } else if (c === GRAY) {
        const idx = stack.indexOf(next);
        const cycleNodes = canonicalizeCycle(stack.slice(idx));
        const key = cycleNodes.join(">");
        if (!seenCycleKeys.has(key)) {
          seenCycleKeys.add(key);
          cycles.push(cycleNodes);
        }
      }
    }
    stack.pop();
    color.set(node, BLACK);
  }

  for (const node of moduleGraph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) dfsModules(node, []);
  }

  return { filesChecked: allFiles.length, boundaryViolations, cycles, moduleGraph, graph };
}
