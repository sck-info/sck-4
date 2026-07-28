import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
      phone: string;
      phoneCode: string;
      sessionVersion: number;
      isPhoneVerified: boolean;
    };
  }

  interface User {
    id: string;
    role: string;
    name: string;
    email: string;
    phone: string;
    phoneCode: string;
    sessionVersion: number;
    isPhoneVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    name: string;
    email: string;
    phone: string;
    phoneCode: string;
    sessionVersion: number;
    isPhoneVerified: boolean;
  }
}
