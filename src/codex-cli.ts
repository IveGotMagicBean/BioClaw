import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const HOST_CODEX_NODE_MODULES_CONTAINER_PATH = '/opt/host-node-modules';
export const HOST_CODEX_CLI_JS_CONTAINER_PATH =
  '/opt/host-node-modules/@openai/codex/bin/codex.js';

let cachedCodexCliNodeModulesRoot: string | null | undefined;

function trimNonEmpty(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveCodexHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = trimNonEmpty(env.CODEX_HOME);
  if (!configured) {
    return path.join(os.homedir(), '.codex');
  }
  if (configured === '~') {
    return os.homedir();
  }
  if (configured.startsWith('~/')) {
    return path.join(os.homedir(), configured.slice(2));
  }
  return path.resolve(configured);
}

export function readHostCodexAuthJson(env: NodeJS.ProcessEnv = process.env): string | null {
  const authPath = path.join(resolveCodexHome(env), 'auth.json');
  try {
    const raw = fs.readFileSync(authPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      auth_mode?: unknown;
      tokens?: {
        access_token?: unknown;
        refresh_token?: unknown;
      };
    };
    if (
      parsed.auth_mode === 'chatgpt' &&
      typeof parsed.tokens?.access_token === 'string' &&
      parsed.tokens.access_token.trim() &&
      typeof parsed.tokens?.refresh_token === 'string' &&
      parsed.tokens.refresh_token.trim()
    ) {
      return raw;
    }
  } catch {
    // Ignore malformed or missing auth state.
  }
  return null;
}

export function hasHostCodexAuth(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readHostCodexAuthJson(env));
}

export function resolveHostCodexCliNodeModulesRoot(): string | null {
  if (cachedCodexCliNodeModulesRoot !== undefined) {
    return cachedCodexCliNodeModulesRoot;
  }

  try {
    const codexEntry = execFileSync('bash', ['-lc', 'readlink -f "$(command -v codex)"'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!codexEntry) {
      cachedCodexCliNodeModulesRoot = null;
      return cachedCodexCliNodeModulesRoot;
    }

    const nodeModulesRoot = path.dirname(
      path.dirname(path.dirname(path.dirname(codexEntry))),
    );
    const cliEntry = path.join(nodeModulesRoot, '@openai', 'codex', 'bin', 'codex.js');
    cachedCodexCliNodeModulesRoot = fs.existsSync(cliEntry) ? nodeModulesRoot : null;
  } catch {
    cachedCodexCliNodeModulesRoot = null;
  }

  return cachedCodexCliNodeModulesRoot;
}

export function hasHostCodexCli(): boolean {
  return Boolean(resolveHostCodexCliNodeModulesRoot());
}
