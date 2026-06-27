import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/lib/supabase/admin";

type AppRole = "evaluador" | "administrador" | "auditor";

export const authOptions: NextAuthOptions = {
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
      // `user` is only populated on the initial sign-in event
      if (user?.email) {
        const supabase = createAdminClient();

        // Query role from email-keyed table (compatible with NextAuth OAuth flow)
        const { data: existing } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle();

        if (existing) {
          token.role = existing.role as AppRole;
        } else {
          // First login — resolve role from ADMIN_EMAILS env, then persist
          const adminEmails = (process.env.ADMIN_EMAILS ?? "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

          const role: AppRole = adminEmails.includes(user.email)
            ? "administrador"
            : "evaluador";

          token.role = role;

          const { error: insertErr } = await supabase
            .from("user_roles")
            .insert({ email: user.email, role });

          if (insertErr) {
            console.error("[auth] insert user_roles:", insertErr.message);
          }
        }

        token.company_id = "";
      }
      return token;
    },

    async session({ session, token }) {
      // Expose role and company_id to client via useSession()
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "evaluador";
        session.user.company_id = (token.company_id as string) ?? "";
      }

      // Build Supabase-compatible JWT for RLS
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.id,
          email: session.user?.email,
          role: "authenticated",
          app_metadata: {
            role: token.role,
            company_id: token.company_id,
          },
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret);
      }

      return session;
    },
  },
};
