# config/

This folder contains editor, linter, and type-checker configuration for the S.A.G.A.R. / NetraSonar platform.

| File | Purpose |
|------|---------|
| `pyrightconfig.json` | Pyright (Python type checker / VS Code Pylance) — configures venv path, included/excluded source paths, and suppressed diagnostic rules |

> **Note**: Pyright is invoked by VS Code's Pylance extension automatically when `pyrightconfig.json` is present. Paths inside this file are relative to this `config/` directory.
