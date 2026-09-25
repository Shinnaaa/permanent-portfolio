// Suggests how to split newly-arriving money (from outside the portfolio —
// this app doesn't track where it comes from) across all four categories,
// including cash: cash is a normal target destination here, not a source,
// since the new money was never part of the existing cash balance. Two modes:
//  - "smart": fills the most-underweight categories first, then spills any
//    remainder across categories proportional to their target weight.
//  - "proportional": always splits strictly by target weight.
export function computeAllocation(amount, mode, total, cats, roundTo = 100) {
  if (!amount || amount <= 0) return { suggestions: null, projection: null };

  const newTotal = total + amount;
  const withGap = cats.map((c) => ({
    ...c,
    targetValue: total * c.target,
    gap: Math.max(0, total * c.target - c.value),
  }));

  let suggestions;
  if (mode === "proportional") {
    suggestions = withGap.map((c) => {
      const allocated = amount * c.target;
      return { key: c.key, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
    });
  } else {
    const totalGap = withGap.reduce((sum, c) => sum + c.gap, 0);
    let raw;
    if (amount <= totalGap) {
      raw = withGap.map((c) => {
        const allocated = totalGap > 0 ? amount * (c.gap / totalGap) : 0;
        return { key: c.key, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
      });
    } else {
      const remaining = amount - totalGap;
      raw = withGap.map((c) => {
        const allocated = c.gap + remaining * c.target;
        return { key: c.key, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
      });
    }
    // Round to tidy numbers (¥100, $1, … — see currency.roundingStep), then
    // nudge the largest category so the rounded amounts still sum to the exact input.
    const rounded = raw.map((c) => ({ ...c, amount: Math.round(c.amount / roundTo) * roundTo }));
    const roundedTotal = rounded.reduce((sum, c) => sum + c.amount, 0);
    const remainder = amount - roundedTotal;
    if (remainder !== 0) {
      const largestIdx = rounded.reduce((best, c, i) => (c.amount > rounded[best].amount ? i : best), 0);
      rounded[largestIdx].amount += remainder;
    }
    suggestions = rounded.map((c) => ({ ...c, newValue: c.currentValue + c.amount }));
  }

  const projection = cats.map((c) => {
    const s = suggestions.find((x) => x.key === c.key);
    return { ...c, newValue: s.newValue, newShare: newTotal > 0 ? s.newValue / newTotal : 0 };
  });

  return { suggestions, projection };
}
