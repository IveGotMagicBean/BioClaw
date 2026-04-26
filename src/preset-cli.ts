/**
 * Preset CLI — terminal entrypoint for managing provider presets.
 *
 * Usage:
 *   npm run preset -- list
 *   npm run preset -- switch <name>
 *   npm run preset -- save <name> <provider> [model] [--desc "..."]
 *   npm run preset -- delete <name>
 *   npm run preset -- default <name>
 *
 * "switch" prints the preset that should be applied — chat-level switching
 * (per-agent runtime_config updates) still happens via `/preset switch` in
 * the chat UI, since agent identity is per-thread.
 */
import {
  deletePreset,
  formatPresetsList,
  getPreset,
  isValidPresetName,
  loadPresets,
  PresetProvider,
  setDefaultPreset,
  upsertPreset,
} from './provider-presets.js';

const PROVIDERS: readonly PresetProvider[] = [
  'anthropic',
  'openrouter',
  'openai-compatible',
  'openai-codex',
  'gemini',
];

function isProvider(value: string): value is PresetProvider {
  return (PROVIDERS as readonly string[]).includes(value);
}

function usage(): never {
  process.stderr.write(`Usage:
  npm run preset -- list
  npm run preset -- switch <name>
  npm run preset -- save <name> <provider> [model] [--desc "description"] [--base-url URL]
  npm run preset -- delete <name>
  npm run preset -- default <name>

Providers: ${PROVIDERS.join(', ')}
`);
  process.exit(1);
}

function extractFlag(args: string[], flag: string): { value?: string; rest: string[] } {
  const idx = args.indexOf(flag);
  if (idx < 0) return { rest: args };
  const value = args[idx + 1];
  return { value, rest: [...args.slice(0, idx), ...args.slice(idx + 2)] };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  const [action, ...rest] = args;

  switch (action) {
    case 'list':
    case 'show': {
      process.stdout.write(formatPresetsList() + '\n');
      return;
    }

    case 'switch':
    case 'use':
    case 'apply': {
      const name = rest[0];
      if (!name) usage();
      const preset = getPreset(name);
      if (!preset) {
        process.stderr.write(`Preset not found: ${name}\n`);
        process.exit(1);
      }
      const modelSuffix = preset.model ? ` · ${preset.model}` : '';
      process.stdout.write(
        `Preset ${name}: ${preset.provider}${modelSuffix}\n\n` +
        `To activate in a chat session, run this in BioClaw chat:\n\n` +
        `  /preset switch ${name}\n`,
      );
      return;
    }

    case 'save': {
      const { value: description, rest: afterDesc } = extractFlag(rest, '--desc');
      const { value: baseUrl, rest: afterBaseUrl } = extractFlag(afterDesc, '--base-url');
      const [name, provider, model] = afterBaseUrl;
      if (!name || !provider) usage();
      if (!isValidPresetName(name)) {
        process.stderr.write(`Invalid preset name: ${name}\n`);
        process.exit(1);
      }
      if (!isProvider(provider)) {
        process.stderr.write(`Unknown provider: ${provider}\nAvailable: ${PROVIDERS.join(', ')}\n`);
        process.exit(1);
      }
      upsertPreset({ name, provider, model, baseUrl, description });
      process.stdout.write(`Saved preset ${name}: ${provider}${model ? ` · ${model}` : ''}\n`);
      return;
    }

    case 'delete':
    case 'remove':
    case 'rm': {
      const name = rest[0];
      if (!name) usage();
      const ok = deletePreset(name);
      process.stdout.write(ok ? `Deleted preset ${name}.\n` : `Preset not found: ${name}.\n`);
      process.exit(ok ? 0 : 1);
    }

    case 'default': {
      const name = rest[0];
      if (!name) usage();
      try {
        setDefaultPreset(name);
        process.stdout.write(`Default preset set to ${name}.\n`);
      } catch (err) {
        process.stderr.write((err instanceof Error ? err.message : String(err)) + '\n');
        process.exit(1);
      }
      return;
    }

    case 'path': {
      // Utility: print the resolved presets file path.
      const file = loadPresets();
      process.stdout.write(
        `Presets: ${file.presets.length} entries, default=${file.default || '(none)'}\n`,
      );
      return;
    }

    default:
      usage();
  }
}

main().catch((err) => {
  process.stderr.write((err instanceof Error ? err.message : String(err)) + '\n');
  process.exit(1);
});
