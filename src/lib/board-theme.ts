/** Board backgrounds the reader can choose between (the picker in the header). */
export const BOARD_THEMES = [
  { id: "plain", label: "Toza" },
  { id: "dots", label: "Nuqtali" },
  { id: "grid", label: "Katak" },
  { id: "lines", label: "Chiziqli" },
  { id: "chalk", label: "Doska" },
] as const;

export type BoardTheme = (typeof BOARD_THEMES)[number]["id"];

export const BOARD_THEME_KEY = "daftar-board-theme";
export const DEFAULT_BOARD_THEME: BoardTheme = "plain";

export function isBoardTheme(value: unknown): value is BoardTheme {
  return BOARD_THEMES.some((t) => t.id === value);
}
