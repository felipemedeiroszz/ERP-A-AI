import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-red-500 text-white text-3xl font-bold flex items-center justify-center">
          🔒
        </div>
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
        >
          Voltar ao Login
        </Link>
      </div>
    </main>
  );
}
