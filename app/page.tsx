import Link from "next/link";
import { authSafe } from "@/auth";
import { SignInButtons } from "@/components/auth/SignInButtons";
import { configuredAuthProviders } from "@/lib/auth/providers";
import { getAppDisplayName, getAppTagline } from "@/lib/config/app";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FluxUserSubCard } from "@/components/dev/FluxUserSubCard";
import { clearStaleSessionAction } from "@/app/actions/clear-stale-session";

export default async function HomePage() {
  const session = await authSafe();
  const providers = configuredAuthProviders();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{getAppDisplayName()}</h1>
        <p className="mt-2 text-sm text-[var(--muted-fg)]">{getAppTagline()}</p>
      </header>

      <Card>
        {session?.user ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              Signed in{session.user.email ? ` as ${session.user.email}` : ""}
            </p>
            <FluxUserSubCard sub={session.user.id} />
            <Link href="/control-room">
              <Button className="w-full">Open control room</Button>
            </Link>
          </div>
        ) : (
          <SignInButtons providers={providers} />
        )}
      </Card>

      <form action={clearStaleSessionAction}>
        <button
          type="submit"
          className="w-full text-center text-xs text-[var(--muted-fg)] underline"
        >
          Clear stale session cookie
        </button>
      </form>

      <p className="text-center text-xs text-[var(--muted-fg)]">
        <Link href="/login" className="underline">
          Sign in page
        </Link>
      </p>
    </div>
  );
}
