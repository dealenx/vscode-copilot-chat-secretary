# Proposal: Improve Tree Views UX

## Summary

Improve user experience for User Requests and Dialogs tree views by:

1. Fixing auto-refresh that disrupts hover tooltips
2. Showing all user requests when expanding a dialog (not just first preview)
3. Adding ability to copy individual messages

## Problem Statement

Current issues:

- **Hover disruption**: Auto-refresh every 5 seconds calls `refreshStatus()` which fires `onDidChangeTreeData`, causing hover tooltips to close before user can read them
- **Limited dialog preview**: Expanded dialogs only show first message preview, but users want to see all requests
- **No message copy**: Cannot copy individual request messages for debugging

## Proposed Solution

### 1. Smart Refresh (No Unnecessary Updates)

Only fire `onDidChangeTreeData` when actual data changes:

- Track last known content hash
- Compare before firing refresh
- Skip refresh if content is identical

### 2. Expand Dialogs with Full Request List

When user expands a dialog in Dialogs view:

- Load chat JSON from stored file
- Parse all user requests
- Display each request as child item with truncated preview
- Full message in tooltip

### 3. Copy Request Message Command

Add command to copy a specific request message:

- Context menu on request items in both views
- Copy full message text to clipboard

## Scope

- Modify `extension.ts` - smarter auto-refresh logic
- Modify `processedDialogsTreeProvider.ts` - expand to show all requests
- Modify `requestsTreeProvider.ts` - add copy message command
- Modify `package.json` - register new command and context menus

## Out of Scope

- Changing Chat Monitor view behavior
- Modifying the copilot-chat-analyzer library

## Success Criteria

- [ ] Hover tooltips remain visible during auto-refresh cycle
- [ ] Expanded dialogs show all user requests
- [ ] Can copy any request message to clipboard
