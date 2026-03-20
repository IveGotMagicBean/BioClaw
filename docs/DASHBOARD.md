# Lab trace dashboard

Optional **observability UI**: timeline of agent runs, streaming output chunks, IPC sends, scheduled tasks, and Docker spawns. Data is stored in SQLite (`agent_trace_events`) and pushed to the browser via **SSE**.

## Where it listens

- **Local web + dashboard together** (`ENABLE_LOCAL_WEB=true` and `ENABLE_DASHBOARD=true`): **chat and lab trace share one page** at **`/`** — top **tabs** on narrow screens (**对话 / 实验追踪**), **side‑by‑side columns** from ~1100px width up. **`/dashboard`** redirects to **`/?tab=trace`** (bookmark-friendly). Quick start: **`npm run web`**.
- **Dashboard only** (no local web): a **dedicated** HTTP server uses `DASHBOARD_HOST` / `DASHBOARD_PORT`; the UI is at **`/`** on that port.

## Enable

In `.env`:

```bash
ENABLE_DASHBOARD=true
# Standalone dashboard only (ignored when ENABLE_LOCAL_WEB=true):
DASHBOARD_HOST=localhost
DASHBOARD_PORT=8787
# Optional: require auth for dashboard HTML + APIs (standalone /health stays open)
# DASHBOARD_TOKEN=your-secret
```

The web UI supports **中文 / English** under the **settings** (gear) menu; language is saved in `localStorage`.

Restart BioClaw. Logs print either:

```text
Dashboard: http://localhost:8787/
```

(standalone) or a log line pointing at **`/`** for the unified UI (merged).

## Event types (examples)

| `type` | Source | Meaning |
|--------|--------|---------|
| `run_start` | `index` | User/chat batch handed to the agent (prompt preview, counts). |
| `container_spawn` | `container-runner` | Docker container name for this run. |
| `stream_output` | `index` / scheduler | Each parsed streaming result from the agent (preview capped). |
| `run_end` / `run_error` | `index` | Final status for a chat-driven run. |
| `scheduled_run_*` | `task-scheduler` | Cron/interval task lifecycle. |
| `ipc_send` | `ipc` | Text or image forwarded from the container to a channel. |

You can extend trace payloads from `container/agent-runner` if you need richer fields in the UI.

## API

Paths are the same in merged mode (on the local web port).

- **Standalone:** `GET /health` — no auth.
- **Merged:** use local web `GET /health` for process health; dashboard APIs are under the paths below.
- `GET /` — HTML: standalone dashboard home **or** merged **unified** chat+trace page (auth on trace APIs if `DASHBOARD_TOKEN` set; HTML embeds token for SSE when configured). `GET /dashboard` (merged) **302 →** `/?tab=trace`.
- `GET /api/trace/list?limit=200&group_folder=…`
- `GET /api/trace/stream` — SSE; with token use `?token=…` (EventSource cannot set headers).
- `GET /api/workspace/groups` — folder names under `groups/`.
- `GET /api/workspace/tree?group_folder=…` — read-only tree (depth/node limits).

## Privacy

Trace rows may contain **prompt previews** and **model output previews**. Do not expose the dashboard on a public interface without `DASHBOARD_TOKEN` and a reverse proxy.
