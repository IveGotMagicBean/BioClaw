/**
 * Gemini CLI integration — mirror of codex-cli.ts.
 *
 * Supports two auth modes, tried in this order:
 *   1. OAuth credentials at ~/.gemini/oauth_creds.json (produced by `gemini auth`)
 *   2. GEMINI_API_KEY env var (Google AI Studio direct)
 *
 * The CLI binary (`gemini`) is located the same way as Codex — by resolving
 * its entrypoint on PATH and walking up to the node_modules root so the
 * entire CLI package can be mounted read-only into the container.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const HOST_GEMINI_CLI_JS_CONTAINER_PATH =
  '/opt/host-node-modules-gemini/@google/gemini-cli/dist/index.js';

let cachedGeminiCliNodeModulesRoot: string | null | undefined;

function trimNonEmpty(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveGeminiHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = trimNonEmpty(env.GEMINI_HOME);
  if (!configured) {
    return path.join(os.homedir(), '.gemini');
  }
  if (configured === '~') {
    return os.homedir();
  }
  if (configured.startsWith('~/')) {
    return path.join(os.homedir(), configured.slice(2));
  }
  return path.resolve(configured);
}

/**
 * Read OAuth credentials JSON produced by `gemini auth`.
 * Returns the raw JSON string if access/refresh tokens look valid, else null.
 */
export function readHostGeminiOAuthJson(env: NodeJS.ProcessEnv = process.env): string | null {
  const authPath = path.join(resolveGeminiHome(env), 'oauth_creds.json');
  try {
    const raw = fs.readFileSync(authPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      access_token?: unknown;
      refresh_token?: unknown;
      token_type?: unknown;
    };
    if (
      typeof parsed.access_token === 'string' &&
      parsed.access_token.trim() &&
      typeof parsed.refresh_token === 'string' &&
      parsed.refresh_token.trim()
    ) {
      return raw;
    }
  } catch {
    // Ignore malformed or missing auth state.
  }
  return null;
}

export function hasHostGeminiOAuth(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readHostGeminiOAuthJson(env));
}

export function hasHostGeminiApiKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(trimNonEmpty(env.GEMINI_API_KEY));
}

export function hasHostGeminiAuth(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasHostGeminiOAuth(env) || hasHostGeminiApiKey(env);
}

export function resolveHostGeminiCliNodeModulesRoot(): string | null {
  if (cachedGeminiCliNodeModulesRoot !== undefined) {
    return cachedGeminiCliNodeModulesRoot;
  }

  try {
    const geminiEntry = execFileSync(
      'bash',
      ['-lc', 'readlink -f "$(command -v gemini)"'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();
    if (!geminiEntry) {
      cachedGeminiCliNodeModulesRoot = null;
      return cachedGeminiCliNodeModulesRoot;
    }

    // geminiEntry typically resolves to
    // <prefix>/lib/node_modules/@google/gemini-cli/dist/index.js
    // Walk up four levels to reach the node_modules root.
    const nodeModulesRoot = path.dirname(
      path.dirname(path.dirname(path.dirname(geminiEntry))),
    );
    const cliEntry = path.join(nodeModulesRoot, '@google', 'gemini-cli', 'dist', 'index.js');
    cachedGeminiCliNodeModulesRoot = fs.existsSync(cliEntry) ? nodeModulesRoot : null;
  } catch {
    cachedGeminiCliNodeModulesRoot = null;
  }

  return cachedGeminiCliNodeModulesRoot;
}

export function hasHostGeminiCli(): boolean {
  return Boolean(resolveHostGeminiCliNodeModulesRoot());
}
