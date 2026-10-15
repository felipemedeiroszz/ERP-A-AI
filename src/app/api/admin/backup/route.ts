import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `backup-erp-acai-${ts}.sql`;
    const filePath = path.join(backupDir, fileName);

    const dbUrl = process.env.DATABASE_URL || "";
    const match =
      /postgresql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/.exec(dbUrl);
    let cmd = "";
    if (match) {
      const [, user, pass, host, port, db] = match;
      cmd = `set PGPASSWORD=${pass} && pg_dump -U ${user} -h ${host} -p ${port} -d ${db} -F p -b -v -f "${filePath}" 2>&1`;
    } else {
      cmd = `pg_dump "${dbUrl}" -F p -b -f "${filePath}" 2>&1`;
    }

    try {
      await execAsync(cmd);
    } catch (execError: any) {
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Erro ao executar pg_dump. Verifique se o PostgreSQL está instalado e no PATH. " +
              (execError?.message || execError?.stderr || ""),
          },
          { status: 500 }
        );
      }
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Arquivo de backup não foi gerado. Execute: npx prisma migrate deploy e verifique pg_dump.",
        },
        { status: 500 }
      );
    }

    const stat = fs.statSync(filePath);
    return NextResponse.json({
      success: true,
      file: fileName,
      sizeBytes: stat.size,
      path: filePath,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Erro no backup" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    return NextResponse.json({ success: true, files: [] });
  }
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => {
      const stat = fs.statSync(path.join(backupDir, f));
      return { name: f, size: stat.size, created: stat.birthtime };
    })
    .sort((a, b) => (a.created < b.created ? 1 : -1));
  return NextResponse.json({ success: true, files });
}
