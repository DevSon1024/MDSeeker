import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { getPendingFiles } from "./documentService";

export type IncomingFilesCallback = (filePaths: string[]) => void | Promise<void>;

/**
 * Initializes the incoming file listener and drains any startup pending files.
 *
 * Implements the reliable subscription-and-drain strategy:
 * 1. Subscribes to the Tauri "incoming-files" event for subsequent instances.
 * 2. Immediately drains any pending startup files from the Rust queue.
 * 3. Invokes the callback with any valid files received.
 *
 * Returns an unlisten function for cleanup on unmount.
 */
export async function initIncomingFileService(
  onFilesReceived: IncomingFilesCallback
): Promise<UnlistenFn> {
  let unlisten: UnlistenFn = () => {};

  // 1. Register listener for live incoming files from subsequent launches
  try {
    unlisten = await listen<string[]>("incoming-files", async (event) => {
      if (Array.isArray(event.payload) && event.payload.length > 0) {
        await onFilesReceived(event.payload);
      } else {
        const pending = await getPendingFiles();
        if (pending.length > 0) {
          await onFilesReceived(pending);
        }
      }
    });
  } catch (err) {
    // Non-tauri or test environment fallback
    console.warn("Could not register 'incoming-files' event listener:", err);
  }

  // 2. Drain any startup pending files buffered before frontend initialized
  try {
    const pendingStartup = await getPendingFiles();
    if (pendingStartup && pendingStartup.length > 0) {
      await onFilesReceived(pendingStartup);
    }
  } catch (err) {
    console.warn("Could not drain pending startup files:", err);
  }

  return unlisten;
}
