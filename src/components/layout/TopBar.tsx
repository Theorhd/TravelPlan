import { useI18n } from "../../i18n";

export function TopBar({
  locationLabel,
  onOpenSettings,
  onRefreshLocation,
}: Readonly<{
  locationLabel: string;
  onOpenSettings: () => void;
  onRefreshLocation: () => void;
}>) {
  const { t } = useI18n();

  return (
    <header className="top-bar">
      <div>
        <h1>{t("app.title")}</h1>
        <p>{t("app.subtitle")}</p>
      </div>
      <div className="top-bar-actions">
        <button className="ghost-button" type="button" onClick={onRefreshLocation}>
          {t("home.autoLocation")}
        </button>
        <button className="ghost-button" type="button" onClick={onOpenSettings}>
          {t("settings.title")}
        </button>
      </div>
      <div className="location-pill">{locationLabel}</div>
    </header>
  );
}
