"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock, ArrowRight, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callback = search.get("callbackUrl") || "/admin";
  const error = search.get("error");

  const [email, setEmail] = useState("admin@acai.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        toast.error("E-mail ou senha inválidos");
      } else {
        toast.success("Login realizado!");
        setTimeout(() => {
          window.location.href = callback;
        }, 500);
      }
    } catch (error) {
      console.error("❌ Erro no login:", error);
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-full border border-purple-200">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Enterprise ERP</span>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Sistema de Gestão Profissional
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Plataforma completa para gestão de açaiterias. Controle total de pedidos, 
              estoque, delivery e finanças em um único lugar.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Segurança Avançada</h3>
                <p className="text-sm text-muted-foreground">Autenticação segura e criptografia de dados</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Interface Intuitiva</h3>
                <p className="text-sm text-muted-foreground">Design moderno e fácil de usar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">A</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-600">Entre com suas credenciais para acessar o sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Erro ao acessar. Verifique suas credenciais.
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Acessar Sistema
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-semibold text-purple-900 mb-2">🔐 Contas de Teste</p>
                <div className="space-y-1 text-xs text-purple-700">
                  <p><span className="font-medium">Admin:</span> admin@acai.com / admin123</p>
                  <p><span className="font-medium">Atendente:</span> atendente@acai.com / atend123</p>
                  <p><span className="font-medium">Cozinha:</span> cozinha@acai.com / cozinha123</p>
                  <p><span className="font-medium">Entregador:</span> entregador@acai.com / entregador123</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            © 2024 ERP Açaiteria. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
