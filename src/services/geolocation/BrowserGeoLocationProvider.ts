import type { GeoProviderPort } from "../../core/ports/GeoProviderPort";
import type { GeoContext } from "../../models/domain";
import { nowIsoTimestamp } from "../../utils/dates";
import { currencyForCountry, guessCountryName } from "../../utils/geo";

type ReverseGeocodeResponse = {
  countryCode?: string;
  countryName?: string;
  city?: string;
  locality?: string;
  principalSubdivision?: string;
};

async function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6_000 },
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResponse | null> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ReverseGeocodeResponse;
  } catch {
    return null;
  }
}

function fallbackFromLocale(): GeoContext {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const countryCode = locale.split("-")[1]?.toUpperCase() ?? "FR";

  return {
    countryCode,
    countryName: guessCountryName(countryCode),
    city: "Unknown city",
    district: "Unknown district",
    currency: currencyForCountry(countryCode),
    updatedAt: nowIsoTimestamp(),
  };
}

export class BrowserGeoLocationProvider implements GeoProviderPort {
  async resolveCurrentLocation(): Promise<GeoContext> {
    const position = await getCurrentPosition();
    if (!position) {
      return fallbackFromLocale();
    }

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const geo = await reverseGeocode(lat, lon);

    const countryCode = geo?.countryCode?.toUpperCase() ?? fallbackFromLocale().countryCode;
    return {
      countryCode,
      countryName: geo?.countryName ?? guessCountryName(countryCode),
      city: geo?.city ?? geo?.locality ?? "Unknown city",
      district: geo?.principalSubdivision ?? "Unknown district",
      currency: currencyForCountry(countryCode),
      latitude: lat,
      longitude: lon,
      updatedAt: nowIsoTimestamp(),
    };
  }
}
