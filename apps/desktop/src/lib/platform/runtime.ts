/**
 * Returns `true` when the app is running inside the Tauri desktop shell.
 * Checks for the global Tauri internals object injected by the native layer.
 */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
