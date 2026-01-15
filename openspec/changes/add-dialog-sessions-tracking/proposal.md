# Proposal: Add Dialog Sessions Tracking

## Summary

Add functionality to track and display dialog sessions (identified by `sessionId`) in the extension, with session history persistence and a list of processed dialogs.

## Motivation

Currently, the extension monitors only the **current** active chat without tracking session identity or history. Users cannot:

1. See which dialog session they are working with
2. View previously processed dialog sessions
3. Track session continuity across VS Code restarts

Additionally, the architecture boundary between the extension and `copilot-chat-analyzer` library needs clarification — the extension does NOT export chat data directly; this is handled exclusively by VS Code's built-in command.

## Scope

### In Scope

1. **copilot-chat-analyzer library**:

   - Add `getSessionId(chatData): string | null` method to extract `sessionId`
   - Add `DialogSession` interface with session metadata
   - Add `failed` status to `DialogStatus` enum for API error detection
   - Detect failed dialogs via `result.errorDetails` in chat export

2. **VS Code extension**:

   - Track current session ID from active chat
   - Store processed dialog sessions history (using VS Code globalState)
   - Display list of processed dialogs in a new tree view
   - Show session ID in the chat monitor panel

3. **Architecture documentation**:
   - Clarify that extension uses `workbench.action.chat.export` command (VS Code built-in)
   - Document that `copilot-chat-analyzer` is for parsing/analysis only, not exporting

### Out of Scope

- Modifying how VS Code exports chat data
- Adding chat export functionality to `copilot-chat-analyzer`
- Syncing sessions across machines

## Technical Approach

### Session ID Location

Based on analysis of chat export JSON:

```
requests[].result.metadata.sessionId
```

The `sessionId` is a UUID v4 that:

- Remains constant for all requests within a single dialog
- Is unique per dialog session
- Is available only after the model responds (inside `result.metadata`)

### Session History Storage

Use VS Code's `globalState` to persist:

```typescript
interface DialogSessionRecord {
  sessionId: string;
  firstSeen: number; // Timestamp
  lastSeen: number; // Timestamp
  requestsCount: number;
  status: DialogStatusType;
  firstRequestPreview: string; // Truncated first user message
}
```

## Related Capabilities

- New capability: `dialog-sessions` — Session tracking and history
- New capability: `dialog-status-failed` — Failed status detection from API errors
- New capability: `architecture` — Documents system boundaries

## Success Criteria

1. `getSessionId()` correctly extracts session ID from chat data
2. Extension displays current session ID in the monitor panel
3. Processed dialogs are persisted and displayed in a new view
4. Clear documentation establishes `copilot-chat-analyzer` as analysis-only library
5. `getDialogStatus()` returns `"failed"` when `result.errorDetails` is present
6. Failed dialogs display with warning icon (⚠️) in UI
