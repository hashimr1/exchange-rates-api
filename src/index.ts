import * as dotenv from "dotenv";
import express from "express";
import { insertData, calculateExchangeDifference, preCalculateRates, getPreCalculatedDifferences } from "./rates/rates.service";
import { MonthlyExchangeRates, ExchangeRateDifferences } from "./rates/rates.interface";


dotenv.config();
const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;

const app = express();
app.use(express.json());
const appRouter = express.Router();

let exchangeRates: MonthlyExchangeRates;
let ratesDifferences: ExchangeRateDifferences;


insertData("./monthly.csv")
    .then(data => {
        exchangeRates = data;
        console.log('Exchange rates data loaded successfully.');
        preCalculateRates(exchangeRates)
            .then(data => {
                ratesDifferences = data;
                console.log('Differences successfully precalculated.');
            })
            .catch(error => {
                console.error('Error precalculating differences:', error);
            });
    })
    .catch(error => {
        console.error('Error populating in-memory store:', error);
    });


app.get('/exchange', async (req: Request, res: Response) => {
    try {
        // dates should be in the format YYYYMMDD
        const { from, to, startDate, endDate } = req.query;

        // validate if countries are available 
        if (!(from in exchangeRates) || !(to in exchangeRates)) {
            return res.status(404).json({ error: 'Exchange rates data not available for the requested country' });
        }

        // const exchangeDifferences = calculateExchangeDifference(from, to, startDate, endDate, exchangeRates);
        const exchangeDifferences = getPreCalculatedDifferences(from, to, startDate, endDate, ratesDifferences);

        res.status(200).json({ from, to, startDate, endDate, exchangeDifferences });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send(error.message);
    }
});


app.use("/", appRouter);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});