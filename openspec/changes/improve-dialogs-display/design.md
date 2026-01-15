# Design: Improve Dialogs Display

## Overview

Enhance the Dialogs tree view with expandable items showing message preview and ability to copy chat JSON for debugging.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Chat Export (VS Code command)                                  │
│                  │                                              │
│                  ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  chatMonitorTreeProvider.checkChatStatus()               │  │
│  │  1. Export chat to temp file                             │  │
│  │  2. Read JSON content                                    │  │
│  │  3. Save to chat-exports/{sessionId}.json   ◄── NEW      │  │
│  │  4. Analyze with copilot-chat-analyzer                   │  │
│  │  5. Record session with chatJsonPath        ◄── NEW      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                  │                                              │
│                  ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ProcessedDialogsTreeProvider                            │  │
│  │  - Shows collapsible dialog items           ◄── NEW      │  │
│  │  - getChildren() returns preview item       ◄── NEW      │  │
│  │  - Context menu with "Copy Chat JSON"       ◄── NEW      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## File Storage Structure

```
globalStorageUri/
├── chat-exports/
│   ├── ff72bca6-0dec-4953-b130-a103a97e5380.json
│   ├── bbb2707b-1234-5678-9abc-def012345678.json
│   └── ...
```

## Updated Interfaces

### DialogSessionRecord (modified)

```typescript
interface DialogSessionRecord {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  requestsCount: number;
  status: DialogStatusType;
  firstRequestPreview: string;
  agentId?: string;
  modelId?: string;
  chatJsonPath?: string; // NEW: Path to stored chat JSON file
}
```

## Tree View Structure

### Before

```
DIALOGS
├── ✅ completed  940024bc... · 1 req
├── ✅ completed  e1f784e7... · 1 req
└── ✅ completed  caac264b... · 2 req
```

### After

```
DIALOGS
├── ▶ ✅ completed  940024bc... · 1 req
│   └── 💬 "Create a function that validates..."
├── ▶ ✅ completed  e1f784e7... · 1 req
│   └── 💬 "Help me with the bug..."
└── ▶ ✅ completed  caac264b... · 2 req
    └── 💬 "What is the best way to..."
```

## Context Menu

Right-click on dialog item:

- **Copy Chat JSON** — Copies full chat export JSON to clipboard

## Cleanup Strategy

When session count exceeds MAX_HISTORY_SIZE (100):

1. Sort sessions by lastSeen descending
2. Keep first 100 sessions
3. For removed sessions, delete corresponding JSON files from chat-exports/
4. Update globalState with remaining sessions

## Error Handling

- If JSON file is missing: Show error "Chat export not available for this dialog"
- If file read fails: Show error with details
- On successful copy: Show info "Chat JSON copied to clipboard"
