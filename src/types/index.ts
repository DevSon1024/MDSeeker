export * from "./document";
export * from "./markdown";

export type ViewMode = "reading" | "source" | "split";
export type AppTheme = "light" | "dark" | "system";

export interface AppInfo {
  name: string;
  version: string;
  identifier: string;
  platform: string;
}
