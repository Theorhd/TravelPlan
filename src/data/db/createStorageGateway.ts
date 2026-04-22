import { isTauri } from "@tauri-apps/api/core";
import type { StorageGateway } from "../../core/ports/StorageGateway";
import { LocalStorageGateway } from "./LocalStorageGateway";
import { SQLiteStorageGateway } from "./SQLiteStorageGateway";

export function createStorageGateway(): StorageGateway {
  try {
    if (isTauri()) {
      return new SQLiteStorageGateway();
    }
  } catch {
    return new LocalStorageGateway();
  }

  return new LocalStorageGateway();
}
