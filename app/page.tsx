import Link from "next/link";
import { auth } from "@/auth";
import { SignInButtons } from "@/components/auth/SignInButtons";
import { configuredAuthProviders } from "@/lib/auth/providers";
import { getAppDisplayName, getAppTagline } from "@/lib/config/app";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FluxUserSubCard } from "@/components/dev/FluxUserSubCard";

export default async function HomePage() {
  const session = await auth();
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

      <p className="text-center text-xs text-[var(--muted-fg)]">
        <Link href="/login" className="underline">
          Sign in page
        </Link>
      </p>
    </div>
  );
}
