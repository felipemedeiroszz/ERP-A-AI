import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "@/components/auth/login-form";
import { getCompanySettings, getAppearanceSettings } from "@/lib/settings";

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/admin");

  const company = await getCompanySettings().catch(() => null);
  const appearance = await getAppearanceSettings().catch(() => null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${appearance?.primaryColor || '#6B21A8'} 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 w-full">
        <LoginForm />
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}
