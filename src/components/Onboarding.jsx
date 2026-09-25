import { CURRENCY_CODES } from "../lib/currency";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../lib/format";
import { useLocale } from "../locale";

// First-run screen: shown while every holding is zero.
export default function Onboarding({ onCurrencyChange, onEnter, onSample }) {
  const { t, currency, catLabel } = useLocale();
  return (
    <section className="card onboard">
      <div className="onboard-mark" aria-hidden="true">
        {CATEGORY_KEYS.map((key) => (
          <span key={key} style={{ background: CATEGORY_COLORS[key] }} />
        ))}
      </div>
      <h1 className="onboard-title">{t("onboard.title")}</h1>
      <p className="onboard-body">{t("onboard.body")}</p>
      <ul className="onboard-classes">
        {CATEGORY_KEYS.map((key) => (
          <li key={key}>
            <span className="dot inline" style={{ background: CATEGORY_COLORS[key] }} />
            {catLabel(key)} <span className="onboard-pct">25%</span>
          </li>
        ))}
      </ul>
      <div className="onboard-currency">
        <label htmlFor="onboard-currency">{t("onboard.currency")}</label>
        <select id="onboard-currency" className="set-select" value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <div className="onboard-actions">
        <button className="btn-primary" onClick={onEnter}>
          {t("onboard.enter")} →
        </button>
        <button className="btn-ghost" onClick={onSample}>
          {t("onboard.sample")}
        </button>
      </div>
    </section>
  );
}
