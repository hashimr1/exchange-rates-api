export interface MonthlyExchangeRates {
    [country: string]: { [date: string]: number };
    // {"belgium" : {"1975-10-01": 38.9, "1971-03-01":0.8894423196655696}}
}

export interface ExchangeRateDifferences {
    [countries: string]: { [date: string]: number };
    // {"canada/australia" : {"1975-10-01": 0.028500000000000192, "1971-03-01":-0.011699999999999933}}
}