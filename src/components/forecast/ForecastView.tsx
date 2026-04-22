import { useState } from "react";
import type { AddForecastInput, ExpenseCategory, ForecastExpense } from "../../models/domain";
import { useI18n } from "../../i18n";
import { formatCurrency } from "../../utils/currency";

const CATEGORIES: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

export function ForecastView({
  locale,
  activeCountryCode,
  forecasts,
  onAddForecast,
}: Readonly<{
  locale: string;
  activeCountryCode: string;
  forecasts: ForecastExpense[];
  onAddForecast: (input: AddForecastInput) => void;
}>) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [category, setCategory] = useState<ExpenseCategory>("activities");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [isBooked, setIsBooked] = useState(true);

  const countryForecasts = forecasts.filter((forecast) => forecast.countryCode === activeCountryCode);

  function handleSubmit() {
    if (amount <= 0 || !label) {
      return;
    }

    onAddForecast({
      amount,
      currency,
      category,
      label,
      countryCode: activeCountryCode,
      scheduledDate,
      isBooked,
    });

    setLabel("");
    setAmount(0);
  }

  return (
    <section className="forecast-view">
      <h3>{t("forecast.title")}</h3>
      <div className="form-grid">
        <label>
          <span>Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Hotel / Flight / Activity" />
        </label>
        <label>
          <span>Amount</span>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label>
          <span>Currency</span>
          <input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Date</span>
          <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </label>
        <label>
          <span>Booked</span>
          <select value={isBooked ? "yes" : "no"} onChange={(e) => setIsBooked(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <button className="primary-button" type="button" onClick={handleSubmit}>
        {t("forecast.add")}
      </button>

      <ul className="timeline-list">
        {countryForecasts.map((forecast) => (
          <li key={forecast.id}>
            <div>
              <strong>{forecast.label}</strong>
              <p>
                {forecast.category} · {forecast.scheduledDate}
              </p>
            </div>
            <div>
              <strong>{formatCurrency(forecast.amount, forecast.currency, locale)}</strong>
              <p>{forecast.isBooked ? "Booked" : "Planned"}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
