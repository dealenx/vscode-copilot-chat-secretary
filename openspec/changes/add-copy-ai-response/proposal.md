# Proposal: Add Copy AI Response

## Summary

Add ability to copy AI agent responses to clipboard from both OPENED DIALOG and DIALOGS tree views, complementing the existing "Copy Message" functionality for user requests.

## Problem Statement

Currently, users can copy user request messages using the "Copy Message" command, but there is no equivalent action for AI responses. This creates an inconsistent UX and limits users who want to:

- Save AI responses for reference
- Share AI answers in documentation or issues
- Compare responses across different sessions
- Debug AI behavior by examining response content

## Proposed Solution

Add a new command `copilotChatSecretary.copyAIResponse` that:

1. Works on AI response items in OPENED DIALOG view (`contextValue: "aiResponse"`)
2. Works on AI response items in DIALOGS view (`contextValue: "responseItem"`)
3. Copies the full response message text to clipboard
4. Shows inline copy button (same pattern as existing `copyRequestMessage`)

## Scope

### In Scope

- New command registration in `extension.ts`
- New command definition in `package.json`
- Context menu entries for AI response items in both views
- Copy full response text (from tooltip or response object)

### Out of Scope

- Copying formatted/markdown content (plain text only)
- Copying tool call details or metadata
- Keyboard shortcuts (just context menu for now)
- Batch copy of multiple responses

## Impact Analysis

### Files to Modify

- `package.json` - add command definition and menu entries
- `src/extension.ts` - register command handler
- `src/utils/constants.ts` - add command constant (optional)

### No Changes Required

- Tree providers already expose response data via item properties
- No library changes needed (copilot-chat-analyzer)

## Success Criteria

- [ ] Copy button appears on AI response items in OPENED DIALOG view
- [ ] Copy button appears on AI response items in DIALOGS view
- [ ] Clicking copy button puts full response text in clipboard
- [ ] Notification confirms successful copy
- [ ] Error message shown if copy fails

## Risk Assessment

**Low risk** - follows established pattern from `copyRequestMessage` command, minimal code changes, no breaking changes.
