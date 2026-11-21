// Neon Coast Cover Studio — hand-in program.
//
// Copies the app and its screenshots into the output directory and writes
// the dossier the scorer rebuilds from them. Run with `node main.ts`.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

// The output directory: the grader's /output, or the env override when
// the program runs on a developer machine.
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv !== '') return resolve(fromEnv);
  return '/output';
}

// Copy a directory tree, entries in sorted order so repeated runs agree.
function copyTree(from: string, to: string): number {
  let copied = 0;
  mkdirSync(to, { recursive: true });
  const names = readdirSync(from).sort();
  for (const name of names) {
    const src = join(from, name);
    const dst = join(to, name);
    const info = statSync(src);
    if (info.isDirectory()) {
      copied += copyTree(src, dst);
    } else if (info.isFile()) {
      writeFileSync(dst, readFileSync(src));
      copied += 1;
    }
  }
  return copied;
}

function main(): void {
  const out = outputDir();
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const appFiles = copyTree(join(REPO_ROOT, 'app'), join(out, 'app'));
  const shotFiles = copyTree(join(REPO_ROOT, 'screenshots'), join(out, 'screenshots'));

  // The dossier needs at least one screenshot, the first of which is the
  // cover. Fail early with a plain message instead of a deep stack trace.
  if (shotFiles === 0) {
    throw new Error(
      'screenshots/ holds no image: add the cover first (screenshots/1-cover.jpg)',
    );
  }

  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`screenshots: ${shotFiles} file(s) in the hand-in`);

  console.log(
    `Neon Coast Cover Studio handed in: ${appFiles} app files, ` +
      `${shotFiles} screenshots, dossier ${dossier.length} bytes -> ${out}`,
  );
}

main();
