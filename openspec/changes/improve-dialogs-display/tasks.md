# Tasks: Improve Dialogs Display

## Phase 1: Chat JSON Storage

- [x] 1.1 Add `chatJsonPath?: string` field to `DialogSessionRecord` interface
- [x] 1.2 Create `chat-exports/` directory in globalStorageUri during extension activation
- [x] 1.3 Update `chatMonitorTreeProvider` to save chat JSON to file after export
- [x] 1.4 Store file path in session record when recording session
- [x] 1.5 Add cleanup logic to remove old JSON files when session count exceeds 100

## Phase 2: Collapsible Dialog Items with Preview

- [x] 2.1 Change dialog items to use `TreeItemCollapsibleState.Collapsed`
- [x] 2.2 Implement `getChildren()` to return preview child item for expanded dialogs
- [x] 2.3 Create preview child item with quote icon and truncated first message
- [x] 2.4 Add contextValue for dialog items to enable context menu

## Phase 3: Copy Chat JSON Command

- [x] 3.1 Register `copilotChatSecretary.copyChatJson` command in extension.ts
- [x] 3.2 Add command to package.json with clipboard icon
- [x] 3.3 Add context menu entry for dialog items in package.json menus
- [x] 3.4 Implement command: read JSON file and copy to clipboard
- [x] 3.5 Show info message on success, error message if file not found

## Phase 4: Validation

- [ ] 4.1 Test collapsible dialogs expand/collapse correctly
- [ ] 4.2 Test preview shows correct first message
- [ ] 4.3 Test copy command copies valid JSON
- [ ] 4.4 Test cleanup removes old files when limit exceeded
- [x] 4.5 Build extension and verify no errors

## Dependencies

- Phase 2 and 3 depend on Phase 1 (need stored JSON files and paths)
- Phase 2 and 3 can be done in parallel after Phase 1
