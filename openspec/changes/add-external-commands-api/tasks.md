# Tasks: Add External Commands API

## 1. API Types

- [x] 1.1 Create `src/api/types.ts` with public API interfaces
- [x] 1.2 Export types from main module

## 2. Commands Implementation

- [x] 2.1 Create `src/api/commandsApi.ts` with command handlers
- [x] 2.2 Implement `getStatus` command handler
- [x] 2.3 Implement `getCurrentDialog` command handler
- [x] 2.4 Implement `getDialogHistory` command handler with filtering
- [x] 2.5 Implement `getSession` command handler

## 3. Registration

- [x] 3.1 Add commands to `package.json` contributes.commands
- [x] 3.2 Register command handlers in `extension.ts`
- [x] 3.3 Add commands to subscriptions for cleanup

## 4. Constants

- [x] 4.1 Add API command IDs to `src/utils/constants.ts`

## 5. Documentation

- [x] 5.1 Add API section to README.md with usage examples
- [x] 5.2 Document command signatures and return types

## 6. Testing

- [x] 6.1 Manual testing of all API commands
- [x] 6.2 Test with mock external extension
