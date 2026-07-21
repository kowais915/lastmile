import "server-only";

function readRequiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseUrl(): string {
  return readRequiredEnvironment("DATABASE_URL");
}

export function getAppUrl(): string {
  return readRequiredEnvironment("NEXT_PUBLIC_APP_URL");
}
