import type { GeoContext } from "../../models/domain";

export interface GeoProviderPort {
  resolveCurrentLocation(): Promise<GeoContext>;
}
