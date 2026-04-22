import type { ExpenseCategory } from "../../models/domain";
import { formatCurrency } from "../../utils/currency";
import { useI18n } from "../../i18n";

export function StatsView({
  countryName,
  locale,
  remainingEuro,
  remainingAfterForecastEuro,
  targetPerDay,
  actualPerDay,
  paceRatio,
  categories,
}: Readonly<{
  countryName: string;
  locale: string;
  remainingEuro: number;
  remainingAfterForecastEuro: number;
  targetPerDay: number;
  actualPerDay: number;
  paceRatio: number;
  categories: Array<{ category: ExpenseCategory; allocated: number; spent: number }>;
}>) {
  const { t } = useI18n();

  return (
    <section className="stats-view">
      <h3>
        {t("tab.stats")} · {countryName}
      </h3>

      <div className="stats-grid">
        <article className="stat-block">
          <p>{t("stats.remaining")}</p>
          <strong>{formatCurrency(remainingEuro, "EUR", locale)}</strong>
        </article>
        <article className="stat-block">
          <p>{t("stats.forecastImpact")}</p>
          <strong>{formatCurrency(remainingAfterForecastEuro, "EUR", locale)}</strong>
        </article>
        <article className="stat-block">
          <p>{t("stats.dailyPace")}</p>
          <strong>
            {formatCurrency(actualPerDay, "EUR", locale)} / {formatCurrency(targetPerDay, "EUR", locale)}
          </strong>
        </article>
      </div>

      <div className="gauge-wrap">
        <p>Budget pace</p>
        <div className="gauge-track">
          <div className="gauge-fill" style={{ width: `${Math.min(100, Math.max(5, paceRatio * 100))}%` }} />
        </div>
        <small>{Math.round(paceRatio * 100)}% of target</small>
      </div>

      <div className="category-stats">
        {categories.map((item) => {
          const ratio = item.allocated === 0 ? 0 : item.spent / item.allocated;
          return (
            <article key={item.category} className="category-row">
              <p>{item.category}</p>
              <div className="gauge-track small">
                <div className="gauge-fill" style={{ width: `${Math.min(100, Math.max(2, ratio * 100))}%` }} />
              </div>
              <small>
                {formatCurrency(item.spent, "EUR", locale)} / {formatCurrency(item.allocated, "EUR", locale)}
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
