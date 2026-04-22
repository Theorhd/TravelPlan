const COUNTRY_CURRENCY: Record<string, string> = {
  FR: "EUR",
  TH: "THB",
  JP: "JPY",
  US: "USD",
  GB: "GBP",
  VN: "VND",
  AU: "AUD",
  CA: "CAD",
};

export function currencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? "EUR";
}

export function guessCountryName(countryCode: string): string {
  try {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase();
  } catch {
    return countryCode.toUpperCase();
  }
}
