import { useState } from "react";
import SmartInput from "./SmartInput";
import QuickAdjustPopover from "./QuickAdjustPopover";
import { CATEGORY_KEYS } from "../lib/format";
import { useLocale } from "../locale";

export default function UpdateForm({ editing, notes, onSave, onCancel }) {
  const { t, money, catLabel, symbol, currency } = useLocale();
  const [values, setValues] = useState(
    Object.fromEntries(CATEGORY_KEYS.map((key) => [key, editing[key] ?? 0]))
  );
  const [popoverField, setPopoverField] = useState(null);

  const setField = (key, value) => setValues({ ...values, [key]: value });

  const computedTotal = CATEGORY_KEYS.reduce((sum, key) => sum + values[key], 0);

  return (
    <div className="update">
      <div className="update-head">
        <h1>{t("upd.title")}</h1>
        <p className="update-sub">{t("upd.sub")}</p>
      </div>

      <div className="update-form">
        {CATEGORY_KEYS.map((key) => (
          <div key={key} className="upd-row">
            <div className="upd-meta">
              <div className="upd-label">{catLabel(key)}</div>
              {notes[key] && <div className="upd-en">{notes[key]}</div>}
              <div className="upd-hint">{t(`upd.hint.${key}`)}</div>
            </div>
            <div className="upd-input-col">
              <div className="upd-input-wrap">
                <span className="upd-cur">{symbol}</span>
                <SmartInput
                  className="upd-input"
                  value={values[key]}
                  onChange={(v) => setField(key, v)}
                  onFocus={(e) => e.target.select()}
                />
                <button type="button" className="upd-add-btn" title={t("upd.adjust")} onClick={() => setPopoverField(key)}>
                  ＋
                </button>
                <span className="upd-cur-label">{currency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="update-form" style={{ padding: 0, background: "transparent", border: "none" }}>
        <div className="upd-total">
          <span className="upd-total-label">{t("upd.computedTotal")}</span>
          <span className="upd-total-value">{money(computedTotal)}</span>
        </div>
      </div>

      <div className="update-actions">
        <button className="btn-ghost" onClick={onCancel}>
          {t("btn.cancel")}
        </button>
        <button className="btn-primary" onClick={() => onSave(values)}>
          {t("upd.save")}
        </button>
      </div>

      {popoverField && (
        <QuickAdjustPopover
          currentValue={values[popoverField] ?? 0}
          onApply={(v) => setField(popoverField, v)}
          onClose={() => setPopoverField(null)}
        />
      )}
    </div>
  );
}
