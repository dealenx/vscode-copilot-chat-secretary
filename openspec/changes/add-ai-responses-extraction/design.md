# Design: Add AI Responses Extraction

## Overview

This document describes the technical design for extracting AI responses from Copilot chat exports and integrating them into the UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Chat Export JSON                                           │
│  └─ requests[]                                              │
│     └─ message.text (user request)                          │
│     └─ response[] (AI response items)                       │
│     └─ result.metadata.toolCallRounds[] (tool responses)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  copilot-chat-analyzer                                       │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ getUserRequests()   │  │ getAIResponses() [NEW]       │  │
│  │ → UserRequest[]     │  │ → AIResponse[]               │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ getConversationHistory() [NEW]                        │  │
│  │ → ConversationTurn[] (request + response pairs)       │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  VS Code Extension UI                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  DIALOGS Tree View                                   │   │
│  │  └─ Session: 35316f3d... · 2 req                     │   │
│  │     └─ #1: "How are you?"                            │   │
│  │        └─ 🤖 AI: "Hello! How can I help..."          │   │
│  │     └─ #2: "Привет"                                  │   │
│  │        └─ 🤖 AI: "Привет! Чем могу помочь?"          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Data Structures

### AIResponse Interface

```typescript
interface AIResponse {
  /** Reference to the original request */
  requestId: string;

  /** Response ID if available */
  responseId?: string;

  /** Aggregated response text (all parts combined) */
  message: string;

  /** Timestamp when response was generated */
  timestamp?: number;

  /** Index in the conversation (0-based) */
  index: number;

  /** Whether response includes tool calls */
  hasToolCalls: boolean;

  /** Number of tool calls in this response */
  toolCallCount: number;
}
```

### ConversationTurn Interface

```typescript
interface ConversationTurn {
  /** Turn index (0-based) */
  index: number;

  /** User's request */
  request: UserRequest;

  /** AI's response (null if no response yet) */
  response: AIResponse | null;
}
```

## Response Text Extraction

### Source Priority

1. **Primary**: `response[].value` - Direct text response
2. **Secondary**: `result.metadata.toolCallRounds[].response` - Response after tool execution
3. **Fallback**: Empty string if no response found

### Aggregation Rules

```typescript
function extractResponseText(request: any): string {
  const parts: string[] = [];

  // 1. Extract from response array
  if (Array.isArray(request.response)) {
    for (const item of request.response) {
      if (typeof item === "string") {
        parts.push(item);
      } else if (item.value && typeof item.value === "string") {
        parts.push(item.value);
      }
    }
  }

  // 2. Extract from toolCallRounds (for tool-based responses)
  const toolCallRounds = request.result?.metadata?.toolCallRounds;
  if (Array.isArray(toolCallRounds)) {
    for (const round of toolCallRounds) {
      if (round.response && typeof round.response === "string") {
        // Only add if not already included
        if (!parts.includes(round.response)) {
          parts.push(round.response);
        }
      }
    }
  }

  return parts.join("\n\n");
}
```

### Tool Call Detection

```typescript
function countToolCalls(request: any): number {
  const toolCallRounds = request.result?.metadata?.toolCallRounds;
  if (!Array.isArray(toolCallRounds)) return 0;

  return toolCallRounds.reduce((count, round) => {
    return count + (round.toolCalls?.length || 0);
  }, 0);
}
```

## UI Integration

### Tree View Structure

```
DIALOGS
└─ ✅ completed 35316f3d... · 2 req
   └─ 💬 #1: "How are you?"
      └─ 🤖 "Hello! How can I help you today?"
   └─ 💬 #2: "Привет"
      └─ 🤖 "Привет! Чем могу помочь?"
```

### ProcessedDialogItem Types

| contextValue       | Icon | Description          |
| ------------------ | ---- | -------------------- |
| `request`          | 💬   | User request         |
| `response`         | 🤖   | AI response          |
| `response-pending` | ⏳   | Response in progress |

### Tooltip Content

- **Request**: Full user message text
- **Response**: Full AI response text (may be long)

## Edge Cases

### No Response

```typescript
// Response may be null for:
// - In-progress requests
// - Canceled requests
// - Failed requests with no partial response
response: AIResponse | null;
```

### Empty Response

```typescript
// Empty string response is valid (AI chose not to respond)
{
  message: "",
  hasToolCalls: false,
  toolCallCount: 0
}
```

### Multi-Round Tool Calls

Some responses have multiple tool call rounds. All response text is aggregated:

```typescript
// toolCallRounds: [
//   { response: "Let me check...", toolCalls: [...] },
//   { response: "Found the answer!", toolCalls: [] }
// ]
// Result: "Let me check...\n\nFound the answer!"
```

## Testing Strategy

### Unit Tests

1. Basic response extraction
2. Multi-part responses
3. Tool call responses
4. Empty/missing responses
5. Conversation history ordering

### Integration Tests

1. Full conversation display in tree view
2. Tooltip content accuracy
3. Response for in-progress dialogs

## Migration

No migration needed - new methods are additive and don't change existing behavior.
