# Design: Improve Tree Views UX

## Architecture Overview

### Current Flow

```
setInterval(5s) → refreshStatus() → fire() → UI rebuilds → hover closes
```

### Proposed Flow

```
setInterval(5s) → refreshStatus() → compare hash → [if changed] fire() → UI rebuilds
                                               → [if same] skip
```

## Technical Decisions

### 1. Smart Refresh Strategy

**Option A: Content Hash Comparison**

- Hash the JSON content before comparing
- Only fire if hash differs from previous
- Pros: Simple, reliable
- Cons: Small CPU overhead for hashing

**Option B: Version/Counter Tracking**

- Track requestsCount and sessionId
- Only fire if key metrics change
- Pros: No hashing overhead
- Cons: May miss some changes

**Decision**: Use Option B - track key metrics (sessionId, requestsCount, status) since these are already available and cover all meaningful state changes.

### 2. Expanded Dialog Content

**Data Flow:**

```
Dialog item expanded → getChildren(element) →
  read chatJsonPath → parse JSON → extract requests →
  return ProcessedDialogItem[] for each request
```

**Caching Strategy:**

- Cache parsed requests in memory when dialog is first expanded
- Clear cache on refresh
- Prevents repeated file reads

### 3. Copy Message Command

**Implementation:**

- Single command `copilotChatSecretary.copyRequestMessage`
- Works for both User Requests view and expanded Dialog items
- Uses `contextValue` to identify eligible items

## Component Changes

### extension.ts

- Store last known state (sessionId, requestsCount, status)
- Compare before calling provider.refresh()
- Move interval logic to only refresh when state actually changes

### processedDialogsTreeProvider.ts

- Store parsed requests per session in Map
- In getChildren(): if element has record with chatJsonPath, load and parse requests
- Create child items for each request with copy command in context menu

### requestsTreeProvider.ts

- Add contextValue for request items to enable copy menu
- No other changes needed (copy command handles both views)

### package.json

- Add `copilotChatSecretary.copyRequestMessage` command
- Add context menu entries for `requestItem` and `dialogRequestItem`

## Data Structures

### Request Child Item

```typescript
new ProcessedDialogItem(
  `#${index + 1}: "${truncatedMessage}"`, // Label
  TreeItemCollapsibleState.None,
  undefined, // No record needed
  undefined, // No command
  "dialogRequestItem", // contextValue for menu
  new vscode.ThemeIcon("comment"),
  fullMessage, // Full message in tooltip
  `${sessionId}-request-${index}`, // Unique ID
  undefined // No description
);
```

## Error Handling

- If chatJsonPath file not found: show single item "Unable to load requests"
- If JSON parse fails: show error item
- Graceful degradation to current behavior
