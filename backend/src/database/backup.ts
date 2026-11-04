import 'dotenv/config';
import Database from 'better-sqlite3';
import { chmodSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

// Takes a consistent copy of the live database, safe to run while the app is
// serving traffic, then deletes the oldest copies. Run it from cron, and copy
// the folder to another machine: a backup on the same disk won't survive losing
// that disk.
// Env: SQLITE_PATH, SQLITE_BACKUP_DIR (default: "backups" beside the database),
// SQLITE_BACKUP_KEEP (default: 14).
async function main() {
  const source = process.env.SQLITE_PATH;
  if (!source) throw new Error('SQLITE_PATH is not set.');
  const folder =
    process.env.SQLITE_BACKUP_DIR || join(dirname(source), 'backups');
  const keep = Number(process.env.SQLITE_BACKUP_KEEP) || 14;
  mkdirSync(folder, { recursive: true, mode: 0o700 });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = join(folder, `byttrading-${stamp}.sqlite`);

  const db = new Database(source, { readonly: true, fileMustExist: true });
  try {
    await db.backup(target);
  } finally {
    db.close();
  }
  chmodSync(target, 0o600);

  // Leaving WAL mode keeps the backup a single file, with no -wal or -shm files
  // beside it.
  const copy = new Database(target);
  copy.pragma('journal_mode = DELETE');
  const result = copy.pragma('integrity_check', { simple: true });
  copy.close();
  if (result !== 'ok') {
    rmSync(target);
    throw new Error(`Backup failed its integrity check: ${String(result)}`);
  }

  const old = readdirSync(folder)
    .filter((name) => /^byttrading-.*\.sqlite$/.test(name))
    .sort()
    .slice(0, -keep);
  for (const name of old) rmSync(join(folder, name));
  console.log(`Backup written to ${target}, removed ${old.length} old copies.`);
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
