# Architecture Specification

## Overview

The Copilot Chat Secretary system consists of two main components with clear boundaries:

1. **copilot-chat-analyzer** - NPM library for parsing and analyzing chat exports
2. **copilot-chat-secretary** - VS Code extension for monitoring and UI

## System Boundaries

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

## Component Responsibilities

### copilot-chat-analyzer (Analysis Library)

**Purpose**: Parse and analyze Copilot chat JSON exports

**Responsibilities**:

- Parse JSON structure from chat exports
- Extract dialog status (pending, in_progress, completed, canceled, failed)
- Extract session information (sessionId, agentId, modelId)
- Analyze MCP tool usage and success rates
- Extract user requests with message text

**Does NOT**:

- Export chat data from VS Code
- Manage UI or visual components
- Persist any data
- Make network requests

### copilot-chat-secretary (VS Code Extension)

**Purpose**: Monitor Copilot chat sessions and display status in VS Code

**Responsibilities**:

- Call `workbench.action.chat.export` command to get chat JSON
- Use copilot-chat-analyzer to parse and analyze chat data
- Display monitoring UI (tree views)
- Persist session history using `globalState`
- Manage user interactions and commands

**Does NOT**:

- Parse JSON directly (delegates to analyzer)
- Define chat structure or status logic
- Implement analysis algorithms

## Data Flow

1. **Chat Export**: Extension calls `workbench.action.chat.export` command
2. **JSON Parsing**: Extension passes JSON to `CopilotChatAnalyzer`
3. **Analysis**: Analyzer returns status, session info, requests
4. **UI Update**: Extension updates tree views with analysis results
5. **Persistence**: Extension saves session records to `globalState`

## Key Interfaces

### From copilot-chat-analyzer

```typescript
// Dialog status values
const DialogStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELED: "canceled",
  IN_PROGRESS: "in_progress",
  FAILED: "failed",
};

// Session information
interface DialogSession {
  sessionId: string;
  agentId?: string;
  modelId?: string;
}

// Main analyzer class
class CopilotChatAnalyzer {
  getDialogStatus(chatData): DialogStatusType;
  getDialogStatusDetails(chatData): DialogStatusDetails;
  getSessionId(chatData): string | null;
  getSessionInfo(chatData): DialogSession | null;
  getRequestsCount(chatData): number;
  getUserRequests(chatData): UserRequest[];
  getMcpToolMonitoring(chatData): McpMonitoringSummary;
}
```

### From copilot-chat-secretary

```typescript
// Session record for persistence
interface DialogSessionRecord {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  requestsCount: number;
  status: DialogStatusType;
  firstRequestPreview: string;
  agentId?: string;
  modelId?: string;
}
```

## Session ID Location

The `sessionId` is located at:

```
requests[].result.metadata.sessionId
```

Properties:

- UUID v4 format
- Constant for all requests within a single dialog
- Available only after model responds (in `result.metadata`)
