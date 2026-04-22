import type { CountryAdvice } from "../../models/domain";

export interface CountryAdvicePort {
  getAdvice(countryCode: string): Promise<CountryAdvice>;
}
