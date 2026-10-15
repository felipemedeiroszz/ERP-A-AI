import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { UserRole } from "@prisma/client";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      active: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    active: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    active: boolean;
    userId: string;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) {
          console.log('❌ Login: Validação falhou', validated.error);
          return null;
        }

        console.log('🔍 Login: Tentando login para', validated.data.email);

        const user = await prisma.user.findUnique({
          where: { email: validated.data.email.toLowerCase() },
        });

        if (!user) {
          console.log('❌ Login: Usuário não encontrado');
          return null;
        }

        if (!user.active) {
          console.log('❌ Login: Usuário inativo');
          return null;
        }

        const isValid = await verifyPassword(
          validated.data.password,
          user.password
        );

        if (!isValid) {
          console.log('❌ Login: Senha inválida');
          return null;
        }

        console.log('✅ Login: Sucesso para', user.email, user.role);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.active = user.active;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.active = token.active;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
