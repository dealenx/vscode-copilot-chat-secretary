# Project Context

## Purpose

VS Code extension for real-time monitoring and status tracking of GitHub Copilot chat sessions. The extension provides:

- **Chat Monitor Tree View** — Displays current status of Copilot chat sessions
- **Real-time Status Updates** — Automatically tracks chat status (completed, in_progress, canceled, unknown)
- **Request Counter** — Shows total number of requests in the current chat
- **Activity Detection** — Indicates when there's new activity in the chat

## Tech Stack

- **TypeScript** — Primary development language
- **VS Code Extension API** — Extension platform (version ^1.104.0)
- **copilot-chat-analyzer** — Library for analyzing Copilot chat exports
- **esbuild** — Build and bundling
- **pnpm** — Package manager

## Project Conventions

### Code Style

- **Code language**: English (variable names, functions, comments)
- **UI/messages**: English for user interface
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Files**: kebab-case for files, match exported class name
- **Logging**: use `logger` from `utils/logger.ts` with `LogCategory`

### Architecture Patterns

- **TreeProviders** — Display data in sidebar (`providers/`)
- **Services** — Business logic and integrations (`services/`)
- **Utils** — Utility functions and constants (`utils/`)

### Testing Strategy

- Debug via F5 in VS Code (Extension Development Host)
- Manual testing with Copilot chat

### Git Workflow

- **OpenSpec** — Change specifications in `openspec/changes/`
- Verb-led change IDs: `add-`, `update-`, `remove-`, `fix-`, `refactor-`
- Archive completed changes via `openspec archive`

## Domain Context

- **Chat Status** — Current state of the Copilot chat (completed, in_progress, canceled, unknown)
- **Request** — A single user message in the chat
- **Activity** — Detection of new content in the chat

## Important Constraints

- Extension activates when the view is opened
- Uses VS Code's chat export command to get chat content
- No external API dependencies

## External Dependencies

- **copilot-chat-analyzer** — NPM library for analyzing Copilot chat exports
- **VS Code Chat Export API** — Built-in VS Code command for exporting chat content
