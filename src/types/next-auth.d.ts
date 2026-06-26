import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string;
      role: string;
      company_id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    company_id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    company_id: string;
  }
}