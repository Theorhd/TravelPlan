import type { TabKey } from "../../models/domain";
import { useI18n } from "../../i18n";

const TAB_KEYS: TabKey[] = ["home", "stats", "forecast", "rewind"];

export function TabBar({
  activeTab,
  onChange,
}: Readonly<{ activeTab: TabKey; onChange: (tab: TabKey) => void }>) {
  const { t } = useI18n();

  return (
    <nav className="tab-bar" aria-label="Main navigation">
      {TAB_KEYS.map((tab) => (
        <button
          key={tab}
          className={`tab-pill ${activeTab === tab ? "active" : ""}`.trim()}
          onClick={() => onChange(tab)}
          type="button"
        >
          {t(`tab.${tab}` as const)}
        </button>
      ))}
    </nav>
  );
}
