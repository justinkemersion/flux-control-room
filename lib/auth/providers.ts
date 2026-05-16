export type AuthProviderId = "github" | "google";

export function configuredAuthProviders(): AuthProviderId[] {
  const providers: AuthProviderId[] = [];
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push("github");
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push("google");
  }
  return providers;
}
