import type { CountryAdvicePort } from "../core/ports/CountryAdvicePort";
import type { CountryAdvice } from "../models/domain";

const ADVICE_BY_COUNTRY: Record<string, CountryAdvice> = {
  FR: {
    visa: "No visa for EU travelers, always verify your specific nationality rules.",
    banking: "Prefer card payments with low FX fee cards and keep one backup card.",
    health: "Carry EHIC or travel insurance card and basic medication.",
    notes: "Rail strikes can impact regional trains, keep flexible transfers.",
  },
  TH: {
    visa: "Check visa-exemption duration and overstay penalties before entry.",
    banking: "ATM fees are common, withdraw fewer large amounts.",
    health: "Use bottled water where needed and mosquito protection.",
    notes: "Internal flights are affordable but baggage fees can add up quickly.",
  },
  JP: {
    visa: "Short stays are often visa-free for many passports.",
    banking: "Cash is still useful in small shops; 7-Eleven ATMs are convenient.",
    health: "Pharmacies are widespread and very reliable.",
    notes: "Intercity rail passes can optimize long-distance transport costs.",
  },
};

const DEFAULT_ADVICE: CountryAdvice = {
  visa: "Verify visa requirements with official government sources.",
  banking: "Check ATM withdrawal fees and dynamic currency conversion settings.",
  health: "Travel insurance and emergency contact list are recommended.",
  notes: "Track transportation and accommodation taxes in your daily budget.",
};

export class TourDuMondisteAdviceApi implements CountryAdvicePort {
  async getAdvice(countryCode: string): Promise<CountryAdvice> {
    const normalized = countryCode.toUpperCase();

    // Placeholder strategy: V1 ships with curated offline hints and can later plug scraping/API.
    return ADVICE_BY_COUNTRY[normalized] ?? DEFAULT_ADVICE;
  }
}
