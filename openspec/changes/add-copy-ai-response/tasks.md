# Tasks: Add Copy AI Response

## Implementation Checklist

### 1. Command Definition

- [x] 1.1 Add command `copilotChatSecretary.copyAIResponse` to `package.json` contributes.commands
- [x] 1.2 Add icon `$(copy)` for consistency with copyRequestMessage

### 2. Context Menu Configuration

- [x] 2.1 Add menu entry for OPENED DIALOG view (`viewItem == aiResponse`)
- [x] 2.2 Add menu entry for DIALOGS view (`viewItem == responseItem`)
- [x] 2.3 Set menu group to `inline` for button visibility

### 3. Command Handler

- [x] 3.1 Register `copilotChatSecretary.copyAIResponse` command in `extension.ts`
- [x] 3.2 Extract response message from item (tooltip or response.message)
- [x] 3.3 Copy to clipboard using `vscode.env.clipboard.writeText()`
- [x] 3.4 Show success notification
- [x] 3.5 Handle errors with warning message
- [x] 3.6 Add command to context.subscriptions

### 4. Validation

- [ ] 4.1 Manual test: Copy AI response in OPENED DIALOG view
- [ ] 4.2 Manual test: Copy AI response in DIALOGS view
- [ ] 4.3 Manual test: Verify clipboard contains full response text
- [ ] 4.4 Manual test: Verify error handling when response is empty

## Dependencies

- None (all required data already available in tree item properties)

## Notes

- Pattern follows existing `copyRequestMessage` implementation
- Response text available via `item.tooltip` or `item.response?.message`
