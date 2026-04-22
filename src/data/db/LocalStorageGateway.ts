import type { StorageGateway } from "../../core/ports/StorageGateway";
import type { TravelPlanState } from "../../models/domain";

const STORAGE_KEY = "travelplan.state.v1";

export class LocalStorageGateway implements StorageGateway {
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async loadState(): Promise<TravelPlanState | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as TravelPlanState;
    } catch {
      return null;
    }
  }

  async saveState(state: TravelPlanState): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
