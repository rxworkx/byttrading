import 'dotenv/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import dataSource from './data-source';

// Loads a Postgres export (one `COPY ... CSV HEADER` file per table) into an
// empty SQLite database. Usage: npm run db:import -- <folder with the csv files>
//
// COPY writes NULL as an unquoted empty field and an empty string as "", so the
// parser has to keep that distinction.
function parseCsv(text: string): (string | null)[][] {
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  let field = '';
  let quoted = false;
  let inQuotes = false;
  const endField = () => {
    row.push(field === '' && !quoted ? null : field);
    field = '';
    quoted = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') field += text[++i];
      else inQuotes = false;
    } else if (char === '"') {
      inQuotes = true;
      quoted = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\n') {
      endField();
      rows.push(row);
      row = [];
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field !== '' || quoted || row.length > 0) {
    endField();
    rows.push(row);
  }
  return rows;
}

// "2026-07-01 12:34:56.789012+00" to the UTC format the SQLite driver writes.
function toSqliteDatetime(value: string): string {
  const iso = value
    .replace(' ', 'T')
    .replace(/([+-]\d{2})$/, '$1:00')
    .replace(/(\.\d{3})\d+/, '$1');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Bad timestamp: ${value}`);
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function convert(value: string | null, column: ColumnMetadata) {
  if (value === null) return null;
  switch (column.type) {
    case 'boolean':
    case Boolean:
      return value === 't' ? 1 : 0;
    case 'datetime':
      return toSqliteDatetime(value);
    case 'simple-json':
      JSON.parse(value);
      return value;
    default:
      return value;
  }
}

async function main() {
  const folder = process.argv[2];
  if (!folder) throw new Error('Usage: npm run db:import -- <csv folder>');
  if (dataSource.options.type !== 'better-sqlite3') {
    throw new Error('Set DATABASE_DRIVER=sqlite before importing.');
  }
  await dataSource.initialize();

  for (const { tableName } of dataSource.entityMetadatas) {
    const [{ n }] = await dataSource.query<{ n: number }[]>(
      `SELECT count(*) AS n FROM "${tableName}"`,
    );
    if (n > 0) throw new Error(`${tableName} is not empty, aborting.`);
  }

  // Tables load in file order, so foreign keys are checked once at the end.
  await dataSource.query('PRAGMA foreign_keys = OFF');
  await dataSource.query('BEGIN');
  try {
    for (const metadata of dataSource.entityMetadatas) {
      const file = join(folder, `${metadata.tableName}.csv`);
      if (!existsSync(file)) throw new Error(`Missing ${file}`);
      const [header, ...rows] = parseCsv(readFileSync(file, 'utf8'));
      const columns = (header as string[]).map((name) => {
        const column = metadata.columns.find((c) => c.databaseName === name);
        if (!column) {
          throw new Error(`${metadata.tableName}.${name} has no entity column`);
        }
        return column;
      });
      const names = (header as string[]).map((n) => `"${n}"`).join(', ');
      const marks = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO "${metadata.tableName}" (${names}) VALUES (${marks})`;
      for (const row of rows) {
        await dataSource.query(
          sql,
          row.map((value, i) => convert(value, columns[i])),
        );
      }
      console.log(`${metadata.tableName}: ${rows.length}`);
    }
    const broken = await dataSource.query<unknown[]>(
      'PRAGMA foreign_key_check',
    );
    if (broken.length > 0) {
      throw new Error(`${broken.length} foreign key violations`);
    }
    await dataSource.query('COMMIT');
  } catch (error) {
    await dataSource.query('ROLLBACK');
    throw error;
  }
  await dataSource.destroy();
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
