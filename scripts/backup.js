const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envFile = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env) process.env[key] = value;
  }
}
loadEnv();

function parseDatabaseUrl(url) {
  const m = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/.exec(url || "");
  if (!m) return null;
  return {
    user: m[1],
    pass: m[2],
    host: m[3],
    port: m[4],
    db: m[5],
  };
}

function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const creds = parseDatabaseUrl(DATABASE_URL);
  if (!creds) {
    console.error("DATABASE_URL inválida no arquivo .env");
    process.exit(1);
  }

  const backupsDir = path.resolve(__dirname, "..", "backups");
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const file = `backup_${creds.db}_${stamp}.sql`;
  const out = path.join(backupsDir, file);

  const pg_dump = process.platform === "win32"
    ? `"C:\\xampp\\pgsql\\bin\\pg_dump.exe"`
    : "pg_dump";

  const args = [
    "-h", creds.host,
    "-p", creds.port,
    "-U", creds.user,
    "-d", creds.db,
    "-F", "p",
    "-b",
    "-v",
    "-f", out,
  ];

  console.log(`Iniciando backup para ${out}`);

  try {
    const env = {
      ...process.env,
      PGPASSWORD: creds.pass,
      PATH: [
        "C:\\xampp\\pgsql\\bin",
        "C:\\Program Files\\PostgreSQL\\16\\bin",
        "C:\\Program Files\\PostgreSQL\\15\\bin",
        "C:\\Program Files\\PostgreSQL\\14\\bin",
        process.env.PATH || "",
      ].filter(Boolean).join(path.delimiter),
    };
    const result = spawnSync(pg_dump.replace(/^"|"$/g, ""), args, {
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      console.error("pg_dump retornou erro:", result.status);
      process.exit(result.status || 1);
    }
    const size = fs.statSync(out).size;
    console.log(`Backup concluído: ${file} (${(size / 1024).toFixed(1)} KB)`);
    console.log(`Salvo em: ${out}`);
  } catch (err) {
    console.error("Erro ao gerar backup:", err);
    process.exit(1);
  }
}

main();
