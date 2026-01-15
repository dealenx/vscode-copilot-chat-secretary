# Copilot Chat Secretary

A VS Code extension for real-time monitoring and status tracking of GitHub Copilot chat sessions.

## Features

- **Real-time Chat Monitoring** - Automatically monitors Copilot chat sessions and displays current status
- **Status Indicators** - Shows whether chat is completed, in progress, canceled, or unknown
- **Request Counter** - Displays the total number of requests in the current chat session
- **Activity Detection** - Indicates when there's new activity in the chat
- **Tree View Interface** - Clean sidebar view with all monitoring information

## Installation

1. Clone the repository
2. Run `pnpm install`
3. Press F5 in VS Code to launch Extension Development Host
4. Or build with `pnpm run build` and package with `pnpm run package`

## Usage

After installation, you'll see a new "Copilot Chat Secretary" icon in the Activity Bar. Click it to open the Chat Monitor view which shows:

- **Monitoring Status** - Whether automatic monitoring is active
- **Chat Status** - Current status of the Copilot chat (completed, in_progress, canceled, unknown)
- **Requests Count** - Total number of requests in the chat
- **Activity Indicator** - Shows if there's recent activity
- **Refresh Button** - Manually refresh the status

## Configuration

| Setting                              | Default | Description                           |
| ------------------------------------ | ------- | ------------------------------------- |
| `copilotChatSecretary.checkInterval` | 1       | Chat status check interval in seconds |
| `copilotChatSecretary.enableLogging` | false   | Enable debug logging to Output panel  |

## Commands

| Command                                       | Description                         |
| --------------------------------------------- | ----------------------------------- |
| `Copilot Chat Secretary: Refresh Chat Status` | Manually refresh the chat status    |
| `Copilot Chat Secretary: Show Logs`           | Show extension logs in Output panel |

## External API

This extension provides a Commands API for other VS Code extensions to access chat monitoring data.

### Available Commands

```typescript
// Get current chat status
const status = await vscode.commands.executeCommand<ChatStatusResponse>(
  "copilotChatSecretary.api.getStatus"
);
// Returns: { status, sessionId, requestsCount, lastUpdate, isActive }

// Get current dialog session
const dialog =
  await vscode.commands.executeCommand<DialogSessionResponse | null>(
    "copilotChatSecretary.api.getCurrentDialog"
  );
// Returns: DialogSessionResponse or null

// Get dialog history with optional filtering
const history = await vscode.commands.executeCommand<DialogSessionResponse[]>(
  "copilotChatSecretary.api.getDialogHistory",
  { limit: 10, status: "completed" } // optional
);
// Returns: Array of DialogSessionResponse

// Get specific session by ID
const session =
  await vscode.commands.executeCommand<DialogSessionResponse | null>(
    "copilotChatSecretary.api.getSession",
    { sessionId: "abc-123-def-456" }
  );
// Returns: DialogSessionResponse or null
```

### Response Types

```typescript
interface ChatStatusResponse {
  status: "pending" | "in_progress" | "completed" | "canceled" | "failed";
  sessionId: string | null;
  requestsCount: number;
  lastUpdate: number; // Unix timestamp ms
  isActive: boolean;
}

interface DialogSessionResponse {
  sessionId: string;
  status: string;
  firstSeen: number;
  lastSeen: number;
  requestsCount: number;
  firstRequestPreview: string;
  agentId?: string;
  modelId?: string;
}
```

## Dependencies

- [copilot-chat-analyzer](https://www.npmjs.com/package/copilot-chat-analyzer) - Library for analyzing Copilot chat exports

## Development

```bash
# Install dependencies
pnpm install

# Watch mode for development
pnpm run watch

# Build for production
pnpm run build

# Package extension
pnpm run package
```

## License

MIT
