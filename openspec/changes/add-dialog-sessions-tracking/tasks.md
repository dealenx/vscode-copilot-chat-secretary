# Tasks: Add Dialog Sessions Tracking

## Phase 1: copilot-chat-analyzer Library

- [ ] 1.1 Add `DialogSession` interface to `src/index.ts`
- [ ] 1.2 Implement `getSessionId(chatData): string | null` method
- [ ] 1.3 Implement `getSessionInfo(chatData): DialogSession | null` method
- [ ] 1.4 Add `FAILED = "failed"` to `DialogStatus` enum
- [ ] 1.5 Update `getDialogStatus()` to detect `result.errorDetails` and return `"failed"`
- [ ] 1.6 Update `getDialogStatusDetails()` to include `errorMessage` and `errorCode`
- [ ] 1.7 Export new types from library
- [ ] 1.8 Add unit tests for session extraction
- [ ] 1.9 Add unit tests for failed status detection (use `examples/parse-export-chat-with-error/chat.json`)
- [ ] 1.10 Update library README with new API

## Phase 2: VS Code Extension - Session Service

- [ ] 2.1 Create `DialogSessionRecord` interface in `services/dialogSessionsTypes.ts`
- [ ] 2.2 Create `DialogSessionsService` class in `services/dialogSessionsService.ts`
- [ ] 2.3 Implement session history persistence using globalState
- [ ] 2.4 Add session recording when chat data is received
- [ ] 2.5 Add session history retrieval methods

## Phase 3: VS Code Extension - UI Updates

- [ ] 3.1 Update `ChatMonitorTreeProvider` to show current session ID
- [ ] 3.2 Add failed status icon (⚠️) and color to status display
- [ ] 3.3 Create `ProcessedDialogsTreeProvider` for session history
- [ ] 3.4 Register new tree view in `extension.ts`
- [ ] 3.5 Add view container configuration in `package.json`
- [ ] 3.6 Add commands for clearing history, refreshing dialogs list

## Phase 4: Architecture Documentation

- [ ] 4.1 Create `architecture` spec documenting system boundaries
- [ ] 4.2 Document that copilot-chat-analyzer is analysis-only
- [ ] 4.3 Document VS Code export command usage

## Phase 5: Validation

- [ ] 5.1 Test session ID extraction with various chat exports
- [ ] 5.2 Test persistence across VS Code restarts
- [ ] 5.3 Test UI displays correct session info
- [ ] 5.4 Run `openspec validate --strict`

## Dependencies

- Phase 2 depends on Phase 1 (needs library methods)
- Phase 3 depends on Phase 2 (needs session service)
- Phase 4 can be done in parallel with other phases
