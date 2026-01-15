# Design: Add Dialog Sessions Tracking

## Overview

Extend the system to track dialog sessions by extracting `sessionId` from chat exports and maintaining a history of processed dialogs.

## Architecture Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  workbench.action.chat.export (built-in command)         │  │
│  │  - Exports current chat to JSON file                     │  │
│  │  - Only source of chat data                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  copilot-chat-secretary (VS Code Extension)              │  │
│  │  - Calls VS Code export command                          │  │
│  │  - Uses copilot-chat-analyzer to parse JSON              │  │
│  │  - Manages UI (tree views, panels)                       │  │
│  │  - Persists session history (globalState)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  copilot-chat-analyzer (NPM Library)                     │  │
│  │  - Parses chat export JSON                               │  │
│  │  - Extracts status, requests, session info               │  │
│  │  - NO export functionality (analysis only)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### copilot-chat-analyzer

```typescript
interface DialogSession {
  sessionId: string;
  agentId?: string; // e.g., "github.copilot.editsAgent"
  modelId?: string; // e.g., "copilot/gemini-2.5-pro"
}

class CopilotChatAnalyzer {
  // New method
  getSessionId(chatData: CopilotChatData): string | null;

  // New method
  getSessionInfo(chatData: CopilotChatData): DialogSession | null;
}
```

### VS Code Extension

```typescript
// Persisted in globalState
interface DialogSessionRecord {
  sessionId: string;
  firstSeen: number; // Unix timestamp (ms)
  lastSeen: number; // Unix timestamp (ms)
  requestsCount: number;
  status: DialogStatusType;
  firstRequestPreview: string; // First 80 chars of first message
}

// Service for managing session history
interface DialogSessionsService {
  getCurrentSessionId(): string | null;
  getSessionHistory(): DialogSessionRecord[];
  recordSession(sessionId: string, data: Partial<DialogSessionRecord>): void;
  clearHistory(): void;
}
```

## Session ID Extraction Logic

```typescript
getSessionId(chatData: CopilotChatData): string | null {
  if (!chatData?.requests?.length) {
    return null;
  }

  // sessionId is in result.metadata of any request
  // All requests in a dialog share the same sessionId
  for (const request of chatData.requests) {
    const sessionId = request?.result?.metadata?.sessionId;
    if (sessionId && typeof sessionId === 'string') {
      return sessionId;
    }
  }

  return null;
}
```

## Failed Status Detection Logic

The `failed` status is detected from `result.errorDetails` in the last request:

```typescript
// Error structure in chat export JSON:
{
  "result": {
    "errorDetails": {
      "code": "failed",
      "message": "Sorry, your request failed...",
      "responseIsIncomplete": true,
      "confirmationButtons": [...]
    }
  }
}
```

Detection priority in `getDialogStatus()`:

```typescript
getDialogStatus(chatData: CopilotChatData): DialogStatusType {
  // 1. Check if has requests
  if (!this.hasRequests(chatData)) {
    return DialogStatus.PENDING;
  }

  const lastRequest = this.getLastRequest(chatData);

  // 2. Check canceled (highest priority)
  if (lastRequest.isCanceled === true) {
    return DialogStatus.CANCELED;
  }

  // 3. Check failed (NEW - before completed/in_progress)
  if (lastRequest?.result?.errorDetails) {
    return DialogStatus.FAILED;
  }

  // 4. Check completed
  if (Array.isArray(lastRequest.followups) && lastRequest.followups.length === 0) {
    return DialogStatus.COMPLETED;
  }

  // 5. Default to in_progress
  return DialogStatus.IN_PROGRESS;
}
```

### Extended DialogStatusDetails

```typescript
interface DialogStatusDetails {
  status: DialogStatusType;
  statusText: string;
  hasResult: boolean;
  hasFollowups: boolean;
  isCanceled: boolean;
  lastRequestId?: string;
  // NEW fields for failed status
  errorCode?: string; // e.g., "failed"
  errorMessage?: string; // Full error message
}
```

## UI Changes

### Chat Monitor Panel (existing view)

Add new item showing current session:

```
🟢 Automatic Monitoring
✅ Status: completed
📊 Requests: 5
🆔 Session: ff72bca6-0dec...  <-- NEW
⚪ No Activity
🔄 Refresh Now
```

### Processed Dialogs View (new view)

New tree view: `copilotChatSecretary.processedDialogs`

```
📚 Processed Dialogs
  ├── 📝 ff72bca6... - "Create a function..." (✅ completed, 5 req)
  ├── 📝 bbb2707b... - "Help me with..." (✅ completed, 3 req)
  ├── 📝 ee843e6a... - "Fix the bug in..." (❌ canceled, 2 req)
  └── 📝 f0be36b7... - "asdasd" (⚠️ failed, 1 req)  <-- NEW STATUS
```

### Status Icons

| Status      | Emoji | ThemeIcon | Color         |
| ----------- | ----- | --------- | ------------- |
| completed   | ✅    | check     | charts.green  |
| canceled    | ❌    | x         | charts.red    |
| in_progress | 🔄    | sync      | charts.blue   |
| failed      | ⚠️    | warning   | charts.orange |
| unknown     | ❓    | question  | charts.gray   |

## Data Flow

```
1. Timer triggers checkChatStatus()
        ↓
2. Extension calls workbench.action.chat.export
        ↓
3. VS Code writes JSON to temp file
        ↓
4. Extension reads JSON, passes to analyzer
        ↓
5. analyzer.getSessionId(chatData) → sessionId
        ↓
6. Extension checks if sessionId is new/changed
        ↓
7. If new: create DialogSessionRecord
   If existing: update lastSeen, requestsCount, status
        ↓
8. Save to globalState, refresh views
```

## Persistence Strategy

- Use `context.globalState` for cross-session persistence
- Key: `dialogSessionHistory`
- Value: `DialogSessionRecord[]`
- Limit: Keep last 50 sessions (configurable)
- Cleanup: Remove entries older than 30 days (configurable)

## Error Handling

- If `sessionId` is null (dialog not started or no response yet): Skip session tracking
- If globalState read fails: Initialize empty history
- If parsing fails: Log error, continue with unknown session
