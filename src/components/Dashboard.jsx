import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ReferenceLine } from "recharts";
import AnimatedValue from "./AnimatedValue";
import { CATEGORY_COLORS, formatPercent } from "../lib/format";
import { useLocale } from "../locale";

function AllocationTooltip({ active, payload, total }) {
  const { t, money } = useLocale();
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const share = total > 0 ? item.value / total : 0;
  return (
    <div className="tt">
      <div className="tt-label">{item.name}</div>
      <div className="tt-value">{money(item.value)}</div>
      <div className="tt-sub">{t("chart.ofTotal", { pct: formatPercent(share) })}</div>
    </div>
  );
}

function DeviationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="tt">
      <div className="tt-label">{item.payload.name}</div>
      <div className="tt-value">
        {item.value >= 0 ? "+" : ""}
        {item.value.toFixed(2)} pp
      </div>
    </div>
  );
}

const BALANCE_HINTS = [
  [0.9, "balance.perfect"],
  [0.7, "balance.close"],
  [0.4, "balance.progress"],
];

function balanceHintKey(score) {
  const hit = BALANCE_HINTS.find(([threshold]) => score > threshold);
  return hit ? hit[1] : "balance.far";
}

export default function Dashboard({ computed, holdings, settings, onUpdate }) {
  const { t, money, catLabel } = useLocale();
  const { total, cats, mom, balanceScore, totalDev } = computed;
  const pieData = cats.map((c) => ({ name: catLabel(c.key), value: c.value, key: c.key }));
  const devData = cats.map((c) => ({
    name: catLabel(c.key),
    dev: c.dev * 100,
    fill: c.inThreshold ? "#7a8b6f" : c.dev > 0 ? "#b8694e" : "#4e7fb8",
  }));

  return (
    <div className="dash">
      <section className="hero">
        <div className="hero-row">
          <div className="hero-block hero-total">
            <div className="hero-label">{t("dash.total")}</div>
            <AnimatedValue value={total} className="hero-value" />
            <div className="hero-sub-row">
              {mom && (
                <span className={`hero-delta ${mom.delta >= 0 ? "pos" : "neg"}`}>
                  <span className="delta-arrow">{mom.delta >= 0 ? "▲" : "▼"}</span>
                  <span className="delta-value">{money(Math.abs(mom.delta))}</span>
                  <span className="delta-pct">
                    ({mom.delta >= 0 ? "+" : ""}
                    {(mom.deltaPct * 100).toFixed(2)}%)
                  </span>
                  <span className="delta-since">{t("dash.vs", { ym: mom.ym })}</span>
                </span>
              )}
            </div>
          </div>
          <button className="hero-cta" onClick={onUpdate}>
            <span>{t("dash.updateCta")}</span>
            <span className="arrow">→</span>
          </button>
        </div>
        <div
          className="balance-bar-wrap"
          title={t("dash.balanceTitle", { pp: (totalDev * 100).toFixed(1) })}
        >
          <div className="balance-bar-label">
            <span className="bal-name">{t("dash.balanceScore")}</span>
            <span className="bal-num">
              {(balanceScore * 100).toFixed(0)}
              <span className="bal-num-unit">/100</span>
            </span>
          </div>
          <div className="balance-bar-track">
            <div className="balance-bar-fill" style={{ width: `${balanceScore * 100}%` }} />
          </div>
          <div className="balance-bar-hint">{t(balanceHintKey(balanceScore))}</div>
        </div>
        <div className="kpi-grid">
          {cats.map((c) => (
            <div key={c.key} className={`kpi ${c.action}`}>
              <div className="kpi-top">
                <span className="kpi-label">{catLabel(c.key)}</span>
                <span className="kpi-share">{formatPercent(c.share)}</span>
              </div>
              <div className="kpi-value">{money(c.value)}</div>
              <div className="kpi-bar">
                <div className="kpi-bar-target" style={{ left: `${c.target * 100}%` }} />
                <div className="kpi-bar-fill" style={{ width: `${Math.min(100, c.share * 100)}%` }} />
              </div>
              <div className="kpi-bot">
                <span className="kpi-target">{t("kpi.target", { pct: formatPercent(c.target, 0) })}</span>
                <span className={`kpi-dev ${c.dev >= 0 ? "pos" : "neg"}`}>
                  {c.dev >= 0 ? "+" : ""}
                  {formatPercent(c.dev)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card rebalance">
        <div className="card-head">
          <h2>{t("reb.title")}</h2>
          <span className="card-sub">{t("reb.threshold", { pct: formatPercent(settings.threshold, 0) })}</span>
        </div>
        <div className="reb-list">
          {cats.map((c) => (
            <div key={c.key} className={`reb-row reb-${c.action}`}>
              <div className="reb-label">
                <div className="reb-cat">{catLabel(c.key)}</div>
                {c.note && <div className="reb-en">{c.note}</div>}
              </div>
              <div className="reb-numbers">
                <div className="reb-now">
                  <span className="lbl">{t("reb.now")}</span>
                  <span className="val">{money(c.value)}</span>
                  <span className="pct">{formatPercent(c.share)}</span>
                </div>
                <div className="reb-arrow">→</div>
                <div className="reb-target">
                  <span className="lbl">{t("reb.target")}</span>
                  <span className="val">{money(c.targetAmt)}</span>
                  <span className="pct">{formatPercent(c.target)}</span>
                </div>
              </div>
              <div className="reb-action">
                {c.action === "hold" && <span className="badge hold">{t("reb.hold")}</span>}
                {c.action === "add" && <span className="badge add">{t("reb.add", { amount: money(c.diff) })}</span>}
                {c.action === "reduce" && <span className="badge reduce">{t("reb.reduce", { amount: money(-c.diff) })}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <div className="card-head">
            <h2>{t("chart.allocation")}</h2>
            <span className="card-sub">{t("chart.current")}</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#0f0f0e"
                  strokeWidth={3}
                >
                  {pieData.map((c) => (
                    <Cell key={c.key} fill={CATEGORY_COLORS[c.key]} />
                  ))}
                </Pie>
                <Tooltip content={<AllocationTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {cats.map((c) => (
              <div key={c.key} className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS[c.key] }} />
                <span className="legend-label">{catLabel(c.key)}</span>
                <span className="legend-pct">{formatPercent(c.share)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-head">
            <h2>{t("chart.deviation")}</h2>
            <span className="card-sub">{t("chart.pp")}</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={devData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis
                  dataKey="name"
                  stroke="#7a7368"
                  tick={{ fontSize: 11, fontFamily: "Georgia, serif" }}
                  axisLine={{ stroke: "#3a3833" }}
                />
                <YAxis
                  stroke="#7a7368"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={{ stroke: "#3a3833" }}
                  tickFormatter={(v) => v.toFixed(0) + "%"}
                />
                <ReferenceLine y={settings.threshold * 100} stroke="#7a8b6f" strokeDasharray="3 3" />
                <ReferenceLine y={-settings.threshold * 100} stroke="#7a8b6f" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#5a554d" />
                <Tooltip content={<DeviationTooltip />} cursor={{ fill: "rgba(232,227,216,0.04)" }} />
                <Bar dataKey="dev" radius={[2, 2, 0, 0]}>
                  {devData.map((c, i) => (
                    <Cell key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card breakdown">
        <div className="card-head">
          <h2>{t("breakdown.title")}</h2>
          <span className="card-sub">
            {holdings.updatedAt ? t("breakdown.asOf", { date: holdings.updatedAt.slice(0, 10) }) : t("breakdown.none")}
          </span>
        </div>
        <div className="table-scroll">
          <table className="bd-table">
            <thead>
              <tr>
                <th className="left">{t("breakdown.category")}</th>
                <th>{t("breakdown.value")}</th>
                <th>{t("breakdown.target")}</th>
                <th>{t("breakdown.share")}</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.key}>
                  <td className="left">
                    <span className="dot inline" style={{ background: CATEGORY_COLORS[c.key] }} />
                    {catLabel(c.key)}
                    {c.note && <span className="bd-note"> · {c.note}</span>}
                  </td>
                  <td className="num">{money(c.value)}</td>
                  <td className="num">{formatPercent(c.target, 0)}</td>
                  <td className="num">{formatPercent(c.share)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="left">{t("cat.total")}</td>
                <td className="num">{money(total)}</td>
                <td className="num">100%</td>
                <td className="num">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
