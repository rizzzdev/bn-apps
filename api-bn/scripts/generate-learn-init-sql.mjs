// Generate learn module migration.sql from existing tables via pg + information_schema.
// Usage: DATABASE_URL=postgresql://... node scripts/generate-learn-init-sql.mjs
// Tables output in TOPOLOGICAL ORDER (parents before children) so FK constraints
// reference tables that already exist. Prevents Prisma shadow DB apply error P3018.

import pg from "pg";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("Set DATABASE_URL dulu");
  process.exit(1);
}

const SCHEMA = "public";

const client = new pg.Client({ connectionString: DB_URL });
try {
  await client.connect();

  // 1. Enum types
  const enums = await client.query(
    `SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
     FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = $1
     GROUP BY t.typname ORDER BY t.typname`,
    [SCHEMA],
  );

  // 2. Get all table names in this schema
  const tablesRes = await client.query(
    `SELECT c.relname AS table_name
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = $1 AND c.relname <> '_prisma_migrations'
     ORDER BY c.relname`,
    [SCHEMA],
  );
  const allTableNames = new Set(tablesRes.rows.map((r) => r.table_name));

  // 3. Get ALL FKs across schema to build dependency graph
  const allFks = await client.query(
    `SELECT tc.table_name, ccu.table_name AS foreign_table
     FROM information_schema.table_constraints tc
     JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1`,
    [SCHEMA],
  );
  const deps = {};
  for (const t of allTableNames) deps[t] = new Set();
  for (const r of allFks.rows) {
    if (r.foreign_table !== r.table_name && allTableNames.has(r.foreign_table)) {
      deps[r.table_name].add(r.foreign_table);
    }
  }

  // 4. Topological sort via Kahn's algorithm with stable alphabetic tie-breaking
  const remaining = new Set(allTableNames);
  const sortedNames = [];
  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter((t) => [...deps[t]].every((d) => !remaining.has(d)))
      .sort();
    if (ready.length === 0) {
      console.error(
        "CYCLE detected in FK graph; remaining:",
        [...remaining].join(", "),
      );
      process.exit(1);
    }
    for (const t of ready) {
      sortedNames.push(t);
      remaining.delete(t);
    }
  }

  const out = [];

  for (const r of enums.rows) {
    const labels = r.labels.map((l) => `'${l}'`).join(", ");
    out.push(`CREATE TYPE "${r.typname}" AS ENUM (${labels});`);
    out.push("");
  }

  // Emit CREATE TABLE blocks in topo order
  for (const table_name of sortedNames) {
    const cols = await client.query(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [SCHEMA, table_name],
    );
    const pk = await client.query(
      `SELECT a.attname
       FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       WHERE i.indrelid = (($1::text || '.' || $2::text))::regclass AND i.indisprimary`,
      [SCHEMA, table_name],
    );
    const pkCols = pk.rows.map((r) => r.attname);
    const fks = await client.query(
      `SELECT
         tc.constraint_name,
         kcu.column_name,
         ccu.table_name AS foreign_table,
         ccu.column_name AS foreign_column,
         rc.update_rule, rc.delete_rule
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2`,
      [SCHEMA, table_name],
    );
    const uqs = await client.query(
      `SELECT
         tc.constraint_name,
         array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS cols
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
       WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = $1 AND tc.table_name = $2
       GROUP BY tc.constraint_name`,
      [SCHEMA, table_name],
    );
    const idxs = await client.query(
      `SELECT indexname, indexdef
       FROM pg_indexes WHERE schemaname = $1 AND tablename = $2
         AND indexname NOT IN (
           SELECT constraint_name FROM information_schema.table_constraints
           WHERE table_schema = $1 AND table_name = $2 AND constraint_type IN ('PRIMARY KEY','UNIQUE')
         )`,
      [SCHEMA, table_name],
    );

    const colSqls = cols.rows.map((c) => {
      let type = c.udt_name;
      if (c.data_type === "ARRAY") type = `${c.udt_name.replace(/^_/, "")}[]`;
      if (c.data_type === "USER-DEFINED") type = `"${c.udt_name}"`;
      if (c.data_type === "character varying") type = `varchar(${c.character_maximum_length || 255})`;
      if (c.data_type === "numeric" && c.numeric_precision) {
        type = `decimal(${c.numeric_precision},${c.numeric_scale || 0})`;
      }
      if (c.data_type === "timestamp without time zone") type = "timestamp(3)";
      if (c.data_type === "timestamp with time zone") type = "timestamptz(3)";
      let line = `  "${c.column_name}" ${type}`;
      if (c.is_nullable === "NO") line += " NOT NULL";
      if (c.column_default) line += ` DEFAULT ${c.column_default}`;
      return line;
    });

    if (pkCols.length) colSqls.push(`  PRIMARY KEY (${pkCols.map((c) => `"${c}"`).join(", ")})`);
    for (const u of uqs.rows) {
      colSqls.push(`  CONSTRAINT "${u.constraint_name}" UNIQUE (${u.cols.map((c) => `"${c}"`).join(", ")})`);
    }
    for (const f of fks.rows) {
      colSqls.push(
        `  CONSTRAINT "${f.constraint_name}" FOREIGN KEY ("${f.column_name}") REFERENCES "${f.foreign_table}" ("${f.foreign_column}") ON UPDATE ${f.update_rule} ON DELETE ${f.delete_rule}`,
      );
    }

    out.push(`CREATE TABLE "${table_name}" (`);
    out.push(colSqls.join(",\n"));
    out.push(");");
    out.push("");

    for (const i of idxs.rows) {
      out.push(`${i.indexdef};`);
    }
    out.push("");
  }

  console.log(out.join("\n"));
} finally {
  await client.end();
}
