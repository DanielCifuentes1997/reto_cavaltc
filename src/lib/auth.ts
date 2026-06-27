import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/lib/supabase/admin";

type AppRole = "evaluador" | "administrador" | "auditor";

export const authOptions: NextAuthOptions = {
  // Aseguramos el secret globalmente para evitar errores de configuración en producción
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email) as string | undefined;

      if (email) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",").map((e) => e.trim()).filter(Boolean);
        const auditorEmails = (process.env.AUDITOR_EMAILS ?? "")
          .split(",").map((e) => e.trim()).filter(Boolean);

        if (adminEmails.includes(email)) {
          token.role = "administrador" as AppRole;
        } else if (auditorEmails.includes(email)) {
          token.role = "auditor" as AppRole;
        } else {
          const supabase = createAdminClient();
          const { data: existing } = await supabase
            .from("user_roles")
            .select("role")
            .eq("email", email)
            .maybeSingle();

          if (existing) {
            token.role = existing.role as AppRole;
          } else if (user?.email) {
            token.role = "evaluador" as AppRole;
            const { error: insertErr } = await supabase
              .from("user_roles")
              .insert({ email: user.email, role: "evaluador" });
            if (insertErr) console.error("[auth] insert user_roles:", insertErr.message);
          }
        }
        if (user?.email) token.company_id = "";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "evaluador";
        session.user.company_id = (token.company_id as string) ?? "";
      }

      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      
      // Validación crítica para que no falle en AWS
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.id || token.sub,
          email: session.user?.email,
          role: "authenticated",
          app_metadata: {
            role: token.role,
            company_id: token.company_id,
          },
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret);
      } else {
        console.error("ERROR: SUPABASE_JWT_SECRET no está definido en las variables de entorno.");
      }

      return session;
    },
  },
};