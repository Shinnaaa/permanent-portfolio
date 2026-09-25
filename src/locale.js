import { createContext, useContext } from "react";
import { currencySymbol, formatMoney, formatMoneyCompact } from "./lib/currency";
import { translate } from "./lib/i18n";

// Language + currency formatting for every component, provided once by App.
export const LocaleContext = createContext(null);

export function makeLocale(lang, currency) {
  return {
    lang,
    currency,
    t: (key, vars) => translate(lang, key, vars),
    money: (value) => formatMoney(value, currency, lang),
    moneyCompact: (value) => formatMoneyCompact(value, currency, lang),
    symbol: currencySymbol(currency, lang),
    catLabel: (key) => translate(lang, `cat.${key}`),
  };
}

export function useLocale() {
  return useContext(LocaleContext);
}
