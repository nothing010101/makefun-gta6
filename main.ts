// SOLMAR HEAT — paket build untuk bounty gta6-01.
// Skrip ini mengumpulkan game/ dan screenshots/ ke direktori output,
// lalu menyusun dossier.json lewat buildDossier dari vendor.

import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Direktori fallback kalau MAKEFUN_OUTPUT_DIR tidak diset.
const FALLBACK_OUT = '/output';

// Semua batas dossier & game untuk paket ini.
const CAPS = {
  dossierText: 163840,
  shotCount: 4,
  shotBytes: 262144,
  gameFiles: 993,
  gameBytes: 50331648,
  gamePathBytes: 1000,
};

// Folder tempat main.ts ini berada = akar proyek.
const ROOT = dirname(fileURLToPath(import.meta.url));

// Salin satu folder (game / screenshots) ke output kalau ada di sumber.
async function copyFolderIfPresent(folder: string, outDir: string): Promise<void> {
  const from = join(ROOT, folder);
  if (!existsSync(from)) {
    console.log(`[solmar] lewati ${folder} — tidak ditemukan di sumber`);
    return;
  }
  await cp(from, join(outDir, folder), { recursive: true });
  console.log(`[solmar] ${folder}/ disalin ke ${outDir}`);
}

// Susun dossier.json dari isi direktori output yang sudah terisi.
async function writeDossierFile(outDir: string): Promise<void> {
  const text = buildDossier(outDir, {
    text_max_bytes: CAPS.dossierText,
    screenshots: { max: CAPS.shotCount, max_bytes: CAPS.shotBytes },
    game_max_files: CAPS.gameFiles,
    game_max_bytes: CAPS.gameBytes,
    game_path_max_bytes: CAPS.gamePathBytes,
  });
  const dest = join(outDir, 'dossier.json');
  await writeFile(dest, text, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');
  console.log(`[solmar] dossier.json ditulis (${bytes} byte) -> ${dest}`);
}

// Alur utama: siapkan output, salin game lalu screenshots, tulis dossier.
async function buildPackage(): Promise<void> {
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || FALLBACK_OUT);
  await mkdir(join(outDir, 'screenshots'), { recursive: true });
  await copyFolderIfPresent('game', outDir);
  await copyFolderIfPresent('screenshots', outDir);
  await writeDossierFile(outDir);
  console.log('[solmar] paket SOLMAR HEAT siap');
}

buildPackage().catch((err: unknown) => {
  console.error('[solmar] build gagal:', err);
  process.exit(1);
});
