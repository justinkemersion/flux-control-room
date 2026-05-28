import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { configuredAuthProviderIds } from "@/lib/config/env";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];
  const ids = configuredAuthProviderIds();
  if (ids.includes("github")) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      }),
    );
  }
  if (ids.includes("google")) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    );
  }
  return providers;
}

const providers = buildProviders();

if (providers.length === 0 && process.env.NODE_ENV !== "test") {
  throw new Error(
    "No auth providers configured. Set AUTH_GITHUB_* and/or AUTH_GOOGLE_* in .env",
  );
}

function isJwtSessionError(error: unknown): boolean {
  return error instanceof Error && error.name === "JWTSessionError";
}

/** Like auth(), but returns null when the session cookie cannot be decoded (e.g. rotated AUTH_SECRET). */
export async function authSafe() {
  try {
    return await auth();
  } catch (error) {
    if (isJwtSessionError(error)) return null;
    throw error;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  logger: {
    error(error) {
      if (error instanceof Error && isJwtSessionError(error)) return;
      console.error("[auth]", error);
    },
  },
  providers,
  callbacks: {
    jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
