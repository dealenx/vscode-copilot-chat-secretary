# Proposal: Rename User Requests to Opened Dialog

## Summary

Rename the "User Requests" view to "Opened Dialog" and transform it into a full conversation view showing both user messages and AI agent responses with visual status indicators.

## Motivation

Current "User Requests" view only shows user messages, which provides incomplete picture of the conversation. Users need to:

1. See the full dialog context (user + agent messages)
2. Understand if agent responses completed successfully or with errors
3. Have visual indicators for response status

## Scope

### In Scope

1. **Rename view**: "User Requests" → "Opened Dialog"
2. **Show conversation**: Display both user messages and AI responses
3. **Status indicators**: Visual icons for response status (success, error, in_progress)
4. **Use existing data**: Leverage `getConversationHistory()` from copilot-chat-analyzer

### Out of Scope

- Editing messages
- Multiple dialogs in one view (that's what DIALOGS view is for)
- Rich markdown rendering

## UI Design

```
┌─────────────────────────────────────────────────────────┐
│ OPENED DIALOG                              🔄 ⟳        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💬 #1 User: "How are you?"                            │
│     └─ ✅ 🤖 "Hello! How can I help you today?"        │
│                                                         │
│  💬 #2 User: "Напиши код на Python"                    │
│     └─ ✅ 🤖 "Конечно! Вот пример кода..." [3 tools]   │
│                                                         │
│  💬 #3 User: "Исправь ошибку"                          │
│     └─ ❌ 🤖 "Error: API rate limit exceeded"          │
│                                                         │
│  💬 #4 User: "Продолжай"                               │
│     └─ ⏳ 🤖 (waiting for response...)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

Legend:
  💬  - User message
  🤖  - AI agent response
  ✅  - Response completed successfully
  ❌  - Response failed with error
  ⏳  - Response in progress / pending
  [N tools] - Number of tool calls used
```

## Status Indicators

| Status      | Icon              | Description                           |
| ----------- | ----------------- | ------------------------------------- |
| Success     | ✅ `$(check)`     | Response completed without errors     |
| Error       | ❌ `$(error)`     | Response failed (API error, canceled) |
| In Progress | ⏳ `$(sync~spin)` | Response being generated              |
| Pending     | ⏳ `$(clock)`     | Waiting for response                  |

## Technical Approach

### Data Source

Use `CopilotChatAnalyzer.getConversationHistory()` which returns:

```typescript
interface ConversationTurn {
  index: number;
  request: UserRequest;
  response: AIResponse | null;
}

interface AIResponse {
  requestId: string;
  message: string;
  hasToolCalls: boolean;
  toolCallCount: number;
}
```

### Response Status Detection

Determine status from:

- `response === null` → In Progress / Pending
- `response.message` empty + error in chat data → Error
- `response.message` present → Success

### Tree Structure

```
Opened Dialog (view)
├─ ConversationTurnItem (user message, collapsible)
│  └─ ResponseItem (AI response with status)
├─ ConversationTurnItem
│  └─ ResponseItem
└─ ...
```

## Impact Analysis

### Breaking Changes

- View name change in package.json (cosmetic)
- RequestsTreeProvider renamed to OpenedDialogTreeProvider

### Migration

- Existing users will see updated view name
- No data migration needed

## Success Criteria

1. View shows "Opened Dialog" instead of "User Requests"
2. Each user message has expandable AI response
3. Status icons accurately reflect response state
4. Error responses are clearly marked with ❌
5. Tooltips show full message text
