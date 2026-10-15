import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");
  if (!file) return new NextResponse("Missing file", { status: 400 });

  const backupDir = path.join(process.cwd(), "backups");
  const filePath = path.join(backupDir, path.basename(file));

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/sql",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
