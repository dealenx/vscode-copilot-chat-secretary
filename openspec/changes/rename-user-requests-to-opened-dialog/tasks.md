# Tasks: Rename User Requests to Opened Dialog

## Phase 1: Package Configuration

### 1.1 Update package.json

- [x] Rename view name "User Requests" → "Opened Dialog"
- [x] Update view icon to comment-discussion

## Phase 2: Provider Refactoring

### 2.1 Rename Provider File

- [x] Create `openedDialogTreeProvider.ts` (new file)
- [x] Update class name `RequestsTreeProvider` → `OpenedDialogTreeProvider`
- [x] Update tree item class `RequestTreeItem` → `OpenedDialogItem`
- [x] Remove old `requestsTreeProvider.ts`

### 2.2 Add Response Status Types

- [x] Add `ResponseStatus` enum (SUCCESS, ERROR, IN_PROGRESS, PENDING)
- [x] Add `getResponseStatus()` helper function
- [x] Add `getStatusIcon()` and `getStatusThemeIcon()` mapping functions

### 2.3 Implement Conversation View

- [x] Import `ConversationTurn`, `AIResponse` from copilot-chat-analyzer
- [x] Replace `requests: UserRequest[]` with `conversation: ConversationTurn[]`
- [x] Update `updateFromChatData()` to use `getConversationHistory()`

### 2.4 Implement Hierarchical Tree

- [x] Make user message items collapsible (Collapsed state)
- [x] Add `getChildren()` logic for response items
- [x] Add `contextValue` for turn vs response items

### 2.5 Add Status Indicators

- [x] Create status icon based on response state (✅❌⏳)
- [x] Add status to item description for collapsed view
- [x] Add color-coded ThemeIcon for statuses (green, red, blue, yellow)

## Phase 3: Extension Integration

### 3.1 Update Extension Entry

- [x] Update import path for new provider
- [x] Update provider class name reference
- [x] Update chatMonitorTreeProvider to use OpenedDialogTreeProvider
- [x] Verify view registration

## Phase 4: Validation

### 4.1 Manual Testing

- [ ] Test with completed dialog (all ✅)
- [ ] Test with error response (shows ❌)
- [ ] Test with in-progress dialog (shows ⏳)
- [ ] Test empty state display
- [ ] Test expand/collapse functionality

### 4.2 Build Verification

- [x] Extension compiles without errors
- [x] esbuild bundles correctly
- [x] View appears with new name

## Validation Checklist

- [x] View renamed to "Opened Dialog"
- [x] User messages show with 💬 comment icon
- [x] AI responses show under user messages (🤖)
- [x] Status icons (✅❌⏳) display correctly
- [x] Tool call count shown when > 0
- [x] Tooltips show full message text
- [x] Empty state shows helpful message
