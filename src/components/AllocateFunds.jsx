import { useMemo, useState } from "react";
import { computeAllocation } from "../lib/allocate";
import { allocatePresets, defaultAllocateAmount, roundingStep } from "../lib/currency";
import { CATEGORY_COLORS } from "../lib/format";
import { useLocale } from "../locale";

export default function AllocateFunds({ computed }) {
  const { t, money, moneyCompact, catLabel, symbol, currency } = useLocale();
  const [amount, setAmount] = useState(() => defaultAllocateAmount(currency));
  const [mode, setMode] = useState("smart");
  const { total, cats } = computed;

  const { suggestions, projection } = useMemo(
    () => computeAllocation(amount, mode, total, cats, roundingStep(currency)),
    [amount, mode, total, cats, currency]
  );

  return (
    <div className="update">
      <div className="update-head">
        <h1>{t("alloc.title")}</h1>
        <p className="update-sub">{t("alloc.sub")}</p>
      </div>

      <div className="update-form">
        <div className="upd-row">
          <div className="upd-meta">
            <div className="upd-label">{t("alloc.amount")}</div>
            <div className="upd-hint">{t("alloc.amountHint")}</div>
          </div>
          <div className="upd-input-wrap">
            <span className="upd-cur">{symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              className="upd-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
            />
            <span className="upd-cur-label">{currency}</span>
          </div>
        </div>
        <div className="alloc-presets">
          {allocatePresets(currency).map((preset) => (
            <button key={preset} className={`alloc-preset ${amount === preset ? "on" : ""}`} onClick={() => setAmount(preset)}>
              {moneyCompact(preset)}
            </button>
          ))}
        </div>
        <div className="alloc-mode-row">
          <div className="alloc-mode-label">{t("alloc.strategy")}</div>
          <div className="alloc-mode-tabs">
            <button className={mode === "smart" ? "on" : ""} onClick={() => setMode("smart")}>
              <span className="m-title">{t("alloc.smart")}</span>
              <span className="m-sub">{t("alloc.smartSub")}</span>
            </button>
            <button className={mode === "proportional" ? "on" : ""} onClick={() => setMode("proportional")}>
              <span className="m-title">{t("alloc.prop")}</span>
              <span className="m-sub">{t("alloc.propSub")}</span>
            </button>
          </div>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>{t("alloc.suggested")}</h2>
            <span className="card-sub">{mode === "smart" ? t("alloc.modeSmart") : t("alloc.modeProp")}</span>
          </div>
          <div className="alloc-results">
            {suggestions.map((s) => {
              const pct = amount > 0 ? (s.amount / amount) * 100 : 0;
              const cat = cats.find((c) => c.key === s.key);
              return (
                <div key={s.key} className="alloc-row">
                  <div className="alloc-row-top">
                    <div className="alloc-row-label">
                      <span className="dot inline" style={{ background: CATEGORY_COLORS[s.key] }} />
                      <span className="alloc-row-name">{catLabel(s.key)}</span>
                      {cat?.note && <span className="alloc-row-en">{cat.note}</span>}
                    </div>
                    <div className="alloc-result-amount">{money(s.amount)}</div>
                  </div>
                  <div className="alloc-row-bar">
                    <div className="alloc-row-bar-fill" style={{ width: `${pct}%`, background: CATEGORY_COLORS[s.key] }} />
                  </div>
                  <div className="alloc-row-bot">
                    <span className="alloc-pct">{t("alloc.pctOf", { pct: pct.toFixed(1) })}</span>
                    <span className="alloc-effect">
                      {money(s.currentValue)} → {money(s.newValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {projection && (
            <div className="alloc-projection">
              <div className="alloc-proj-head">{t("alloc.after")}</div>
              <div className="alloc-proj-bars">
                {projection.map((p) => (
                  <div key={p.key} className="alloc-proj-row">
                    <span className="alloc-proj-name">{catLabel(p.key)}</span>
                    <div className="alloc-proj-bar">
                      <div
                        className="alloc-proj-bar-current"
                        style={{ width: `${p.share * 100}%`, background: CATEGORY_COLORS[p.key], opacity: 0.3 }}
                      />
                      <div className="alloc-proj-bar-new" style={{ width: `${p.newShare * 100}%`, background: CATEGORY_COLORS[p.key] }} />
                      <div className="alloc-proj-bar-target" style={{ left: `${p.target * 100}%` }} />
                    </div>
                    <span className="alloc-proj-pcts">
                      <span className="from">{(p.share * 100).toFixed(1)}%</span>
                      <span className="arr">→</span>
                      <span className="to">{(p.newShare * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="alloc-proj-legend">
                <span>
                  <span className="legend-swatch" style={{ background: "#9a9388", opacity: 0.3 }} />
                  {t("alloc.before")}
                </span>
                <span>
                  <span className="legend-swatch" style={{ background: "#c8a96a" }} />
                  {t("alloc.afterLegend")}
                </span>
                <span>
                  <span className="legend-swatch" style={{ background: "#e8e3d8", width: 1.5 }} />
                  {t("alloc.targetLegend")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
