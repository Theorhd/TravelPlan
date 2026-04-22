import type { StorageGateway } from "../../core/ports/StorageGateway";
import type { TravelPlanState } from "../../models/domain";
import { nowIsoTimestamp } from "../../utils/dates";
import { SQLITE_MIGRATIONS } from "../migrations/sqliteMigrations";

type QueryRow = {
  payload: string;
};

type SQLiteLikeDatabase = {
  execute(query: string, values?: unknown[]): Promise<unknown>;
  select(query: string, values?: unknown[]): Promise<QueryRow[]>;
};

export class SQLiteStorageGateway implements StorageGateway {
  private db: SQLiteLikeDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    const { default: Database } = await import("@tauri-apps/plugin-sql");
    const db = (await Database.load("sqlite:travelplan.db")) as SQLiteLikeDatabase;

    for (const statement of SQLITE_MIGRATIONS) {
      await db.execute(statement);
    }

    this.db = db;
  }

  async loadState(): Promise<TravelPlanState | null> {
    await this.initialize();

    if (!this.db) {
      return null;
    }

    const rows = await this.db.select("SELECT payload FROM app_state WHERE id = 1");
    if (!rows[0]?.payload) {
      return null;
    }

    try {
      return JSON.parse(rows[0].payload) as TravelPlanState;
    } catch {
      return null;
    }
  }

  async saveState(state: TravelPlanState): Promise<void> {
    await this.initialize();

    if (!this.db) {
      return;
    }

    await this.db.execute(
      `
      INSERT INTO app_state (id, payload, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
      `,
      [JSON.stringify(state), nowIsoTimestamp()],
    );
  }
}
