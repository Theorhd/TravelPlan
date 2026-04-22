import type { Expense } from "../../models/domain";
import { useI18n } from "../../i18n";
import { formatCurrency } from "../../utils/currency";

export function RewindView({
  locale,
  expenses,
  reliability,
}: Readonly<{
  locale: string;
  expenses: Expense[];
  reliability: Array<{
    countryCode: string;
    countryName: string;
    forecastEuro: number;
    actualEuro: number;
    reliabilityRatio: number;
  }>;
}>) {
  const { t } = useI18n();

  return (
    <section className="rewind-view">
      <h3>{t("rewind.title")}</h3>

      <div className="reliability-grid">
        {reliability.map((item) => (
          <article className="reliability-item" key={item.countryCode}>
            <p>{item.countryName}</p>
            <strong>{Math.round(item.reliabilityRatio * 100)}%</strong>
            <small>
              {formatCurrency(item.forecastEuro, "EUR", locale)} vs {formatCurrency(item.actualEuro, "EUR", locale)}
            </small>
          </article>
        ))}
      </div>

      <ul className="timeline-list">
        {expenses.map((expense) => (
          <li key={expense.id}>
            <div>
              <strong>{expense.reason}</strong>
              <p>
                {expense.countryName} · {expense.city} · {expense.category}
              </p>
              <p>{expense.description}</p>
            </div>
            <div>
              <strong>{formatCurrency(expense.amount, expense.currency, locale)}</strong>
              <p>{new Date(expense.createdAt).toLocaleString(locale)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
