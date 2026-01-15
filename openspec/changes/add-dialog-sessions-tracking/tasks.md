# Tasks: Add Dialog Sessions Tracking

## Phase 1: copilot-chat-analyzer Library

- [x] 1.1 Add `DialogSession` interface to `src/index.ts`
- [x] 1.2 Implement `getSessionId(chatData): string | null` method
- [x] 1.3 Implement `getSessionInfo(chatData): DialogSession | null` method
- [x] 1.4 Add `FAILED = "failed"` to `DialogStatus` enum
- [x] 1.5 Update `getDialogStatus()` to detect `result.errorDetails` and return `"failed"`
- [x] 1.6 Update `getDialogStatusDetails()` to include `errorMessage` and `errorCode`
- [x] 1.7 Export new types from library
- [x] 1.8 Add unit tests for session extraction
- [x] 1.9 Add unit tests for failed status detection
- [x] 1.10 Update library README with new API

## Phase 2: VS Code Extension - Session Service

- [x] 2.1 Create `DialogSessionRecord` interface in `services/dialogSessionsTypes.ts`
- [x] 2.2 Create `DialogSessionsService` class in `services/dialogSessionsService.ts`
- [x] 2.3 Implement session history persistence using globalState
- [x] 2.4 Add session recording when chat data is received
- [x] 2.5 Add session history retrieval methods

## Phase 3: VS Code Extension - UI Updates

- [x] 3.1 Update `ChatMonitorTreeProvider` to show current session ID
- [x] 3.2 Add failed status icon (⚠️) and color to status display
- [x] 3.3 Create `ProcessedDialogsTreeProvider` for session history
- [x] 3.4 Register new tree view in `extension.ts`
- [x] 3.5 Add view container configuration in `package.json`
- [x] 3.6 Add commands for clearing history, refreshing dialogs list

## Phase 4: Architecture Documentation

- [x] 4.1 Create `architecture` spec documenting system boundaries
- [x] 4.2 Document that copilot-chat-analyzer is analysis-only
- [x] 4.3 Document VS Code export command usage

## Phase 5: Validation

- [x] 5.1 Test session ID extraction with various chat exports (41 unit tests passing)
- [ ] 5.2 Test persistence across VS Code restarts (requires manual testing)
- [ ] 5.3 Test UI displays correct session info (requires manual testing)
- [x] 5.4 Library build and tests pass

## Dependencies

- Phase 2 depends on Phase 1 (needs library methods) ✓
- Phase 3 depends on Phase 2 (needs session service) ✓
- Phase 4 can be done in parallel with other phases ✓
