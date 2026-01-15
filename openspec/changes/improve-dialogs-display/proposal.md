# Proposal: Improve Dialogs Display

## Summary

Improve the Dialogs tree view by showing a preview of the first user message and adding the ability to copy/export the chat JSON for debugging purposes.

## Motivation

Currently, the Dialogs list shows only status, session ID, and request count. Without seeing what the dialog was about, it's hard to identify specific dialogs. Additionally, there's no way to access the raw chat data for debugging.

**Current display:**

```
✅ completed  940024bc... · 1 req
```

**Proposed display:**

```
✅ completed  940024bc... · 1 req
   "Create a function that..."
```

## Scope

### In Scope

1. **Show dialog preview** — Display first ~40 characters of the first user message below the dialog status line
2. **Copy chat JSON** — Add context menu command to copy chat JSON to clipboard for a selected dialog

### Out of Scope

- Navigate into dialogs (blocked by VS Code API limitations)
- Export to file (clipboard copy is sufficient for debugging)

## Technical Approach

### 1. Dialog Preview Display

The `firstRequestPreview` field already exists in `DialogSessionRecord` (up to 80 chars).

**Selected: Option B — Collapsible tree item**

```
▶ ✅ completed  940024bc... · 1 req
    └── "Create a function that validates..."
```

Implementation:

- Make dialog items collapsible (`TreeItemCollapsibleState.Collapsed`)
- Add child item with preview text when expanded
- Use quote icon for preview item

### 2. Copy Chat JSON

**Selected: Option C — Store JSON in files**

Store chat JSON exports as files in extension's globalStorage:

- Path: `globalStorageUri/chat-exports/{sessionId}.json`
- Store path reference in `DialogSessionRecord.chatJsonPath`
- Read file on demand when "Copy Chat JSON" is invoked
- Clean up old files when session limit (100) is exceeded

### 3. Copy Scope

**Selected: Copy works for any dialog that has stored JSON file**

Since we store JSON files, copy will work for all dialogs in history (up to 100 limit).

## Related Capabilities

- New capability: `dialog-preview` — Show first user message preview in collapsible tree
- New capability: `dialog-export` — Copy chat JSON to clipboard from stored files
