# Proposal: Add User Requests History

## Summary

Add a new method to `copilot-chat-analyzer` library to extract and return the history of user requests from Copilot chat export data.

## Motivation

Currently, the extension manually parses `chatData.requests` to extract user messages. This logic should be moved to the `copilot-chat-analyzer` library for:

1. **Reusability** — The library can be used by other projects
2. **Consistency** — Single source of truth for request parsing
3. **Type safety** — Proper TypeScript interfaces for request data
4. **Maintainability** — Changes to chat export format handled in one place

## Scope

### In Scope

- Add `UserRequest` interface to `copilot-chat-analyzer`
- Add `getUserRequests(chatData): UserRequest[]` method to `CopilotChatAnalyzer` class
- Update extension to use the new method instead of manual parsing
- Export the new interface from the library

### Out of Scope

- Changes to chat export format
- UI changes beyond using the new API

## Related Capabilities

- `chat-monitoring` — Uses request history for display

## Success Criteria

1. `getUserRequests()` returns array of user messages with id, message text, timestamp, and index
2. Extension uses the library method instead of inline parsing
3. All existing functionality continues to work
