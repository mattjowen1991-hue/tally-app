import React, { createContext, useContext } from 'react';

const CurrencyContext = createContext('£');

export function CurrencyProvider({ currencySymbol, children }) {
  return (
    <CurrencyContext.Provider value={currencySymbol}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
