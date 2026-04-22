import type { TicketScanResult } from "../../models/domain";

export interface OcrProviderPort {
  parseTicket(photoDataUrl: string): Promise<TicketScanResult>;
}
