## Notes
- The REST API call is of the following format http://localhost:3000/exchange?from=canada&to=australia&startDate=20120103&endDate=20120514
- The DateType format used is YYYYMMDD
- I used the monthly.csv file from https://datahub.io/core/exchange-rates since the daily data would not load for me. I converted the requirements to make sense with this dataset since I had to use months instead.
- The data is structured at key-value pairs in the following format:
```
{"belgium" : {"1982-07-01":0.9892175289346128, "1975-10-01": 38.9, "1971-03-01":0.8894423196655696}}
```
- A sample output for the above request is:
```
{"from":"canada",
"to":"australia",
"startDate":"20120103",
"endDate":"20120514",
"exchangeDifferences":{
    "2012-01-01":0.028500000000000192,
    "2012-02-01":0.0764999999999999,
    "2012-03-01":0.05879999999999996,
    "2012-04-01":0.042199999999999904,
    "2012-05-01":-0.011699999999999933}}
```
- Given more time, I would switch from using in memory storage to a NoSQL database like MongoDB or DynamoDB for better optimization and persistance of data.
- calculateExchangeDifference is not needed after implementing the precalculated differences but left for illustration purposes.
