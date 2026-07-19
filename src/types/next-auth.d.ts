import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
      sessionVersion: number;
    };
  }

  interface User {
    id: string;
    role: string;
    name: string;
    email: string;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    name: string;
    email: string;
    sessionVersion: number;
  }
}
