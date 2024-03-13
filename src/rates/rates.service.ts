import { MonthlyExchangeRates, ExchangeRateDifferences } from "./rates.interface";
import fs from 'fs';
import csvParser from 'csv-parser';


export function insertData(csvFilePath: string): Promise<MonthlyExchangeRates> {
    return new Promise((resolve, reject) => {
        const exchangeRates: MonthlyExchangeRates = {};

        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                const country = row['Country'].toLowerCase(); // lowercase since GET parameter has country as lowercase
                const date = row['Date']; // date is stored as string
                let exchangeRate = parseFloat(row['Exchange rate']);

                if (!exchangeRates[country]) {
                    exchangeRates[country] = {};
                }
                // since certain countries have rates as USD/currency, convert to the reciprocal
                if (country === "australia" || country === "euro" || country === "ireland" || country === "new zealand" || country === "united kingdom") {
                    exchangeRate =  1 / exchangeRate;  
                }

                exchangeRates[country][date] = exchangeRate;
            })
            // handle errors
            .on('error', (error) => {
                console.error('Error parsing CSV:', error);
                reject(error);
            })
            .on('end', () => {                
                resolve(exchangeRates);
            });
    });
}

export function preCalculateRates(exchangeRates: MonthlyExchangeRates): Promise<ExchangeRateDifferences> {
    return new Promise((resolve, reject) => {
        try {
            const exchangeRateDifferences: ExchangeRateDifferences = {};

            // Loop through each pair of countries
            for (const fromCountry in exchangeRates) {
                for (const toCountry in exchangeRates) {
                    if (fromCountry !== toCountry) {
                        // Calculate exchange rate difference for each month
                        const differences: { [date: string]: number } = {};
                        for (const date in exchangeRates[fromCountry]) {
                            const fromRate = exchangeRates[fromCountry][date];
                            const toRate = exchangeRates[toCountry][date];

                            if (toRate === undefined) {
                                // only toRate can be undefined in this case
                                continue;
                            }

                            differences[date] = toRate - fromRate;
                        }
                        // Store exchange rate differences for the pair of countries
                        const key = `${fromCountry}/${toCountry}`;
                        exchangeRateDifferences[key] = differences;
                    }
                }
            }
            resolve(exchangeRateDifferences);
        } catch (error) {
            reject(error);
        }
    });
}

function getSpannedMonths(startDate: string, endDate: string): string[] {
    // when dates are constructed as new Date(year, monthIndex, day), checking for validity is not strictly needed as it will be converted into a valid date ie. new Date(2019, 15, 15) will be resolved to 2020-04-15
    const startDateObj = new Date(parseInt(startDate.slice(0, 4)), parseInt(startDate.slice(4, 6)) - 1, parseInt(startDate.slice(6, 8)));
    const endDateObj = new Date(parseInt(endDate.slice(0, 4)), parseInt(endDate.slice(4, 6)) - 1, parseInt(endDate.slice(6, 8)));

    const dates: string[] = [];
    
    const currentDate = startDateObj;
    
    while (currentDate <= endDateObj) {
        const year = currentDate.getFullYear();
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // adding 1 to get month numbers from 1 to 12 and padding with '0' if necessary
        const monthString = `${year}-${month}-01`;
        
        if (!dates.includes(monthString)) {
            dates.push(monthString);
        }
        
        // move to the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // dates is formatted as ["2022-09-01", "2022-10-01", "2022-11-01"]
    return dates;
}

export function calculateExchangeDifference(from: string, to: string, startDate: string, endDate: string, exchangeRates: MonthlyExchangeRates): { [date: string]: number } {
    const dates = getSpannedMonths(startDate, endDate);

    const exchangeDifferences: { [date: string]: number } = {};
    for (const date of dates) {
        const fromRate =  exchangeRates[from][date];
        const toRate = exchangeRates[to][date];

        if (fromRate === undefined || toRate === undefined) {
            // I decided that it would be better to skip this month as data is unavailable since a value of 0 can mean that there is no difference
            // exchangeDifferences[date] = 0;
            continue;
        }
        
        exchangeDifferences[date] = toRate - fromRate;
    } 

    return exchangeDifferences;
}

export function getPreCalculatedDifferences(from: string, to: string, startDate: string, endDate: string, ratesDifferences: ExchangeRateDifferences): { [date: string]: number } {
    const dates = getSpannedMonths(startDate, endDate);
    const key = `${from}/${to}`;

    const exchangeDifferences: { [date: string]: number } = {};
    for (const date of dates) {
        const difference = ratesDifferences[key][date];
        if (difference === undefined) {
            continue;
        }
        exchangeDifferences[date] = difference;
    } 

    return exchangeDifferences;
}
