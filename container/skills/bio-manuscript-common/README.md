## Bio Manuscript Common

Shared assets for the BioClaw integration of `bio-manuscript-forge`.

Contents:
- `templates/`: journal and manuscript planning templates
- `scripts/`: helper scripts copied from the upstream repository

Integration notes:
- These assets were copied from `external/bio-manuscript-forge/bio-manuscript-forge/`.
- Runtime skills live under `/home/node/.claude/skills/` inside the BioClaw container.
- Keep skill-to-skill references within `container/skills/` and avoid `~/.openclaw/...` assumptions.
- Treat this directory as shared support data for the manuscript pipeline skill family.
