# Tasks: Improve Tree Views UX

## Phase 1: Smart Refresh (Fix Hover Issue)

- [x] 1.1 Add state tracking in extension.ts (lastSessionId, lastRequestsCount, lastStatus)
- [x] 1.2 Modify auto-refresh interval to compare state before firing refresh
- [x] 1.3 Only call `processedDialogsTreeProvider.refresh()` when sessions actually change
- [x] 1.4 Test: hover tooltip stays visible during refresh cycle

## Phase 2: Expand Dialogs with All Requests

- [x] 2.1 Add `requestsCache: Map<string, UserRequest[]>` to ProcessedDialogsTreeProvider
- [x] 2.2 Update getChildren() to load and parse chatJsonPath when element has record
- [x] 2.3 Create child items for each user request with truncated label and full tooltip
- [x] 2.4 Add contextValue "dialogRequestItem" for context menu support
- [x] 2.5 Clear cache on refresh()
- [x] 2.6 Test: expanding dialog shows all user requests

## Phase 3: Copy Request Message Command

- [x] 3.1 Register `copilotChatSecretary.copyRequestMessage` command in extension.ts
- [x] 3.2 Add command to package.json with appropriate icon
- [x] 3.3 Add context menu entries for conversationTurn and dialogRequestItem (fixed viewItem matching)
- [x] 3.4 Implement command: extract message from item and copy to clipboard (fixed to handle turn objects)
- [x] 3.5 Test: copy works for Opened Dialog view and expanded Dialog items

## Phase 4: Validation

- [x] 4.1 Verify hover tooltips remain stable
- [x] 4.2 Verify expanded dialogs show all requests
- [x] 4.3 Verify copy command works in both contexts
- [x] 4.4 Build and test full extension
- [x] 4.5 Update tasks.md with completion status

## Dependencies

- Phase 1 is independent
- Phase 2 requires chatJsonPath from previous improve-dialogs-display work
- Phase 3 can run in parallel with Phase 2 after Phase 1

## Notes

- User Requests view already has request items, just needs contextValue for copy menu
- Dialogs view needs to parse stored JSON to show all requests
- copilot-chat-analyzer library has `getUserRequests()` method for parsing
