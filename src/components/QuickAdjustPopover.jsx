import { useEffect, useRef, useState } from "react";
import { parseExpression } from "../lib/format";
import { adjustPresets } from "../lib/currency";
import { useLocale } from "../locale";

// A small popover for adding/subtracting a quick amount (or expression) from
// a value, used by the "+" button next to each holdings input.
export default function QuickAdjustPopover({ currentValue, onApply, onClose }) {
  const { t, money, moneyCompact, currency } = useLocale();
  const [sign, setSign] = useState("+");
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const parsed = parseExpression(text);
  const delta = parsed !== null ? (sign === "+" ? parsed : -parsed) : null;
  const nextValue = delta !== null ? Math.round(currentValue + delta) : null;

  const apply = () => {
    if (nextValue !== null) {
      onApply(nextValue);
      onClose();
    }
  };

  return (
    <>
      <div className="qa-backdrop" onClick={onClose} />
      <div className="qa-popover" onClick={(e) => e.stopPropagation()}>
        <div className="qa-head">
          <div className="qa-current-label">{t("qa.current")}</div>
          <div className="qa-current-value">{money(currentValue)}</div>
        </div>
        <div className="qa-body">
          <div className="qa-op-row">
            <button className={`qa-op-btn ${sign === "+" ? "on" : ""}`} onClick={() => setSign("+")}>
              +
            </button>
            <button className={`qa-op-btn ${sign === "-" ? "on" : ""}`} onClick={() => setSign("-")}>
              −
            </button>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              className="qa-input"
              placeholder={t("qa.placeholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nextValue !== null) apply();
              }}
            />
          </div>
          <div className="qa-presets">
            {adjustPresets(currency).map((p) => (
              <button key={p} className="qa-preset" onClick={() => setText(String(p))}>
                {moneyCompact(p)}
              </button>
            ))}
          </div>
          {nextValue !== null && (
            <div className="qa-preview">
              <span className="qa-preview-arrow">→</span>
              <span className="qa-preview-value">{money(nextValue)}</span>
              <span className="qa-preview-delta">
                ({sign === "+" ? "+" : "−"}
                {money(parsed)})
              </span>
            </div>
          )}
        </div>
        <div className="qa-actions">
          <button className="btn-ghost" onClick={onClose}>
            {t("btn.cancel")}
          </button>
          <button className="btn-primary" disabled={nextValue === null} onClick={apply}>
            {t("btn.apply")}
          </button>
        </div>
      </div>
    </>
  );
}
