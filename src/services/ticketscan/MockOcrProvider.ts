import type { OcrProviderPort } from "../../core/ports/OcrProviderPort";
import type { TicketScanResult } from "../../models/domain";

const MOCK_MERCHANTS = ["7-Eleven", "Carrefour", "FamilyMart", "Lidl", "Tesco"];
const MOCK_PRODUCTS = [
  "Water",
  "Noodles",
  "Fruit",
  "Metro ticket",
  "Coffee",
  "Sandwich",
  "Sunscreen",
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
}

function inferAmount(photoDataUrl: string): number | undefined {
  const amountMatch = photoDataUrl.match(/(\d+[.,]\d{2})/);
  if (!amountMatch) {
    return undefined;
  }

  return Number.parseFloat(amountMatch[1].replace(",", "."));
}

export class MockOcrProvider implements OcrProviderPort {
  async parseTicket(photoDataUrl: string): Promise<TicketScanResult> {
    const seed = photoDataUrl.length;
    const merchant = MOCK_MERCHANTS[Math.floor(pseudoRandom(seed) * MOCK_MERCHANTS.length)];
    const itemCount = Math.max(2, Math.floor(pseudoRandom(seed + 2) * 4));

    const products = Array.from({ length: itemCount }).map((_, index) => {
      const pick = Math.floor(pseudoRandom(seed + index * 11) * MOCK_PRODUCTS.length);
      return MOCK_PRODUCTS[pick];
    });

    const inferredAmount = inferAmount(photoDataUrl);
    const syntheticAmount = Number((8 + pseudoRandom(seed + 7) * 55).toFixed(2));

    return {
      merchant,
      products,
      amount: inferredAmount ?? syntheticAmount,
      currency: "EUR",
      confidence: inferredAmount ? 0.95 : 0.72,
    };
  }
}
