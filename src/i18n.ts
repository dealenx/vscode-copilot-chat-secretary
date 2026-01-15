// i18n.ts - Copilot Chat Secretary
// Simplified localization for potential future use

interface LocalizationStrings {
  "extension.activated": string;
  "extension.deactivated": string;
}

const strings: LocalizationStrings = {
  "extension.activated": "Copilot Chat Secretary activated",
  "extension.deactivated": "Copilot Chat Secretary deactivated",
};

export function t(key: keyof LocalizationStrings, ...args: string[]): string {
  let text = strings[key] || key;

  // Simple parameter replacement {0}, {1}, etc.
  args.forEach((arg, index) => {
    text = text.replace(`{${index}}`, arg);
  });

  return text;
}
