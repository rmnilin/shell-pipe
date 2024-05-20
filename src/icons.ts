// https://github.com/microsoft/vscode/issues/124703
// https://github.com/microsoft/vscode/blob/1.89.1/src/vs/base/browser/ui/iconLabel/iconLabels.ts#L9
// https://github.com/microsoft/vscode/blob/1.89.1/src/vs/base/common/iconLabels.ts#L12

// Escaping with backslashes breaks fuzzy search, so we use invisible character.
const ESCAPE_SEQUENCE = "\u2064";
const UNESCAPED_REGEXP = /(\$)(\([A-Za-z0-9-]+(~[A-Za-z]+)?\))/g;
const ESCAPED_REGEXP = new RegExp(
  `(\\\$)${ESCAPE_SEQUENCE}(\\([A-Za-z0-9-]+(~[A-Za-z]+)?\\))`,
  "g"
);

export function escapeIcons(text: string): string {
  return text.replace(UNESCAPED_REGEXP, `\$1${ESCAPE_SEQUENCE}\$2`);
}

export function unescapeIcons(text: string): string {
  return text.replace(ESCAPED_REGEXP, "$1$2");
}
