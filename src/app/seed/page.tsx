import { seedDatabase } from "@/lib/seed";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SeedPage() {
  const result = await seedDatabase();
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-white to-purple-50">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold ${
            result.success ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {result.success ? "✓" : "✗"}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {result.success ? "Banco populado!" : "Erro ao popular banco"}
        </h1>
        <p className="text-muted-foreground mb-6">{result.message}</p>
        {result.success && (
          <div className="text-sm text-muted-foreground mb-6 space-y-1 text-left bg-muted rounded-lg p-4">
            <p>
              <strong>Admin:</strong> admin@acai.com / admin123
            </p>
            <p>
              <strong>Atendente:</strong> atendente@acai.com / atend123
            </p>
            <p>
              <strong>Cozinha:</strong> cozinha@acai.com / cozinha123
            </p>
            <p>
              <strong>Entregador:</strong> entregador@acai.com / entregador123
            </p>
          </div>
        )}
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
        >
          Ir para Login
        </Link>
      </div>
    </main>
  );
}
