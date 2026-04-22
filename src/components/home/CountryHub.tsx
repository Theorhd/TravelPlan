import type { CountryAdvice, CountryBudgetPlan } from "../../models/domain";
import { formatCurrency } from "../../utils/currency";
import { useI18n } from "../../i18n";

type CountryInsight = {
  countryCode: string;
  spentEuro: number;
  remainingEuro: number;
};

export function CountryHub({
  countries,
  selectedCountryCode,
  insights,
  locale,
  advice,
  onSelect,
  onLoadAdvice,
}: Readonly<{
  countries: CountryBudgetPlan[];
  selectedCountryCode: string;
  insights: CountryInsight[];
  locale: string;
  advice: CountryAdvice | null;
  onSelect: (countryCode: string) => void;
  onLoadAdvice: (countryCode: string) => Promise<void>;
}>) {
  const { t } = useI18n();

  const selected = countries.find((country) => country.countryCode === selectedCountryCode) ?? countries[0];

  return (
    <section className="country-hub">
      <h3>{t("home.countryHub")}</h3>
      <div className="country-list">
        {countries.map((country) => {
          const metric = insights.find((item) => item.countryCode === country.countryCode);
          return (
            <button
              key={country.countryCode}
              type="button"
              className={`country-chip ${country.countryCode === selectedCountryCode ? "active" : ""}`.trim()}
              onClick={() => {
                onSelect(country.countryCode);
                void onLoadAdvice(country.countryCode);
              }}
            >
              <span>{country.countryName}</span>
              <small>
                {formatCurrency(metric?.remainingEuro ?? country.budgetTotal, "EUR", locale)} left
              </small>
            </button>
          );
        })}
      </div>

      {selected && (
        <article className="country-details">
          <h4>{selected.countryName}</h4>
          <p>
            {selected.city} · {selected.startDate} → {selected.endDate}
          </p>
          <p>
            Budget {formatCurrency(selected.budgetTotal, "EUR", locale)}
          </p>
          {advice ? (
            <div className="country-advice">
              <p>
                <strong>Visa:</strong> {advice.visa}
              </p>
              <p>
                <strong>Banking:</strong> {advice.banking}
              </p>
              <p>
                <strong>Health:</strong> {advice.health}
              </p>
              <p>{advice.notes}</p>
            </div>
          ) : (
            <button className="ghost-button" type="button" onClick={() => void onLoadAdvice(selected.countryCode)}>
              Load travel advice
            </button>
          )}
        </article>
      )}
    </section>
  );
}
