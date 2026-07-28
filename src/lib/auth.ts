import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days
    updateAge: 24 * 60 * 60, // 1 day
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const input = credentials.email as string;
        const isEmail = input.includes("@");

        const condition = isEmail
          ? eq(users.email, input)
          : eq(users.phone, input.replace(/\D/g, "").replace(/^91/, ""));

        const result = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            password: users.password,
            role: roles.roleName,
            sessionVersion: users.sessionVersion,
            isPhoneVerified: users.isPhoneVerified,
            phone: users.phone,
            phoneCode: users.phoneCode,
          })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(condition)
          .limit(1);

        const user = result[0];
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion ?? 1,
          isPhoneVerified: user.isPhoneVerified ?? false,
          phone: user.phone ?? "",
          phoneCode: user.phoneCode ?? "",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.sessionVersion = user.sessionVersion;
        token.isPhoneVerified = user.isPhoneVerified;
        token.phone = user.phone;
        token.phoneCode = user.phoneCode;
      }

      if (trigger === "update" && session?.sessionVersion !== undefined) {
        token.sessionVersion = session.sessionVersion;
      }

      if (trigger === "update" && session?.isPhoneVerified !== undefined) {
        token.isPhoneVerified = session.isPhoneVerified;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.isPhoneVerified = token.isPhoneVerified as boolean;
        session.user.phone = token.phone as string;
        session.user.phoneCode = token.phoneCode as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
