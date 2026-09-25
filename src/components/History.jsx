import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../lib/format";
import { useLocale } from "../locale";

function seriesLabel(t, key) {
  return t(`cat.${key}`);
}

function TotalOverTimeTooltip({ active, payload, label }) {
  const { t, money } = useLocale();
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      {payload.map((item) => (
        <div className="tt-row" key={item.dataKey}>
          <span className="tt-key" style={{ color: item.color }}>
            {seriesLabel(t, item.dataKey)}
          </span>
          <span className="tt-val">{money(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DriftTooltip({ active, payload, label }) {
  const { t } = useLocale();
  if (!active || !payload || !payload.length) return null;
  const sum = payload.reduce((s, item) => s + (item.value || 0), 0);
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      {payload.map((item) => {
        const pct = sum > 0 ? (item.value / sum) * 100 : 0;
        return (
          <div className="tt-row" key={item.dataKey}>
            <span className="tt-key" style={{ color: item.color }}>
              {seriesLabel(t, item.dataKey)}
            </span>
            <span className="tt-val">{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ withTotal, children }) {
  const { t } = useLocale();
  return (
    <div className="legend">
      {withTotal && (
        <div className="legend-item">
          <span className="dot" style={{ background: "#c8a96a" }} />
          <span className="legend-label">{t("cat.total")}</span>
        </div>
      )}
      {CATEGORY_KEYS.map((key) => (
        <div key={key} className="legend-item">
          <span className="dot" style={{ background: CATEGORY_COLORS[key] }} />
          <span className="legend-label">{t(`cat.${key}`)}</span>
        </div>
      ))}
      {children}
    </div>
  );
}

export default function History({ snapshots, onClear, onExport, onImport }) {
  const { t, money, moneyCompact } = useLocale();
  const rows = snapshots.map((snap) => ({
    ...snap,
    total: snap.stocks + snap.bonds + snap.gold + snap.cash,
  }));

  return (
    <div className="history">
      <div className="update-head">
        <h1>{t("hist.title")}</h1>
        <p className="update-sub">{rows.length === 0 ? t("hist.empty") : t("hist.count", { n: rows.length })}</p>
      </div>

      {rows.length > 0 && (
        <>
          <div className="card">
            <div className="card-head">
              <h2>{t("hist.total")}</h2>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rows} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#2a2823" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="ym" stroke="#7a7368" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#3a3833" }} />
                  <YAxis
                    stroke="#7a7368"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: "#3a3833" }}
                    tickFormatter={moneyCompact}
                  />
                  <Tooltip content={<TotalOverTimeTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="#c8a96a" strokeWidth={2.5} dot={{ fill: "#c8a96a", r: 4, stroke: "#0f0f0e", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="stocks" stroke={CATEGORY_COLORS.stocks} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="bonds" stroke={CATEGORY_COLORS.bonds} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="gold" stroke={CATEGORY_COLORS.gold} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="cash" stroke={CATEGORY_COLORS.cash} strokeWidth={1.5} dot={false} opacity={0.7} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Legend withTotal />
          </div>

          <div className="card">
            <div className="card-head">
              <h2>{t("hist.drift")}</h2>
              <span className="card-sub">{t("hist.driftSub")}</span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={rows} margin={{ top: 20, right: 30, left: 0, bottom: 10 }} stackOffset="expand">
                  <defs>
                    <linearGradient id="g-stocks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.stocks} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.stocks} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-bonds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.bonds} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.bonds} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.gold} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.gold} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-cash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.cash} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.cash} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2823" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="ym" stroke="#7a7368" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#3a3833" }} />
                  <YAxis
                    stroke="#7a7368"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: "#3a3833" }}
                    tickFormatter={(v) => Math.round(v * 100) + "%"}
                    domain={[0, 1]}
                  />
                  <Tooltip content={<DriftTooltip />} />
                  <ReferenceLine y={0.25} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <ReferenceLine y={0.5} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <ReferenceLine y={0.75} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <Area type="monotone" dataKey="stocks" stackId="1" stroke={CATEGORY_COLORS.stocks} fill="url(#g-stocks)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="bonds" stackId="1" stroke={CATEGORY_COLORS.bonds} fill="url(#g-bonds)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="gold" stackId="1" stroke={CATEGORY_COLORS.gold} fill="url(#g-gold)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="cash" stackId="1" stroke={CATEGORY_COLORS.cash} fill="url(#g-cash)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Legend>
              <div className="legend-item" style={{ marginLeft: "auto", opacity: 0.6 }}>
                <span style={{ display: "inline-block", width: 14, height: 1, borderTop: "1px dashed #e8e3d8", marginRight: 6 }} />
                <span className="legend-label">{t("hist.guides")}</span>
              </div>
            </Legend>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>{t("hist.log")}</h2>
            </div>
            <div className="table-scroll">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th className="left">{t("hist.month")}</th>
                    {CATEGORY_KEYS.map((key) => (
                      <th key={key}>{t(`cat.${key}`)}</th>
                    ))}
                    <th>{t("cat.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.ym}>
                      <td className="left mono">{r.ym}</td>
                      {CATEGORY_KEYS.map((key) => (
                        <td key={key} className="num">
                          {money(r[key])}
                        </td>
                      ))}
                      <td className="num bold">{money(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="card sync-card">
        <div className="card-head">
          <h2>{t("hist.backup")}</h2>
          <span className="card-sub">{t("hist.backupSub")}</span>
        </div>
        <p className="sync-text">{t("hist.backupBody")}</p>
        <div className="sync-actions">
          <button className="btn-primary" onClick={onExport}>
            ↓ {t("data.export")}
          </button>
          <button className="btn-ghost" onClick={onImport}>
            ↑ {t("data.import")}
          </button>
          {snapshots.length > 0 && (
            <button className="btn-ghost danger" onClick={onClear}>
              {t("hist.clear")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
