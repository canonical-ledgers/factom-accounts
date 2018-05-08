# Factom AccountsJS

This tool is built for Factom authority node operators and grant recipients to enable them to record the value of their payouts in a fiat currency of their choice. It achieves this by watching a specified address on the Factom blockchain, then outputting a CSV with transaction and price data. It can also be connected to the bitcoin.tax API to post transaction data directly into your bitcoin.tax account.

The tool is intended to be left operating so it can check for new transactions at regular intervals. However, it is also capable of filling in historic price data for all transactions received at an address. For transactions less than one week old, it is able to fetch historical price data per minute. Transactions older than one week can only be matched to hourly price data, so is naturally less accurate.


## Installing NodeJS

First, install NodeJS on your system.

### Ubuntu

```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### MacOS

Visit the NodeJS website to download in the installer package: https://nodejs.org/en/#download

Alternatively, if you have Homebrew installed:

```
brew install node
```

## Installing Factom AccountsJS

Clone the repo into your target directory. Then, navigate into project folder and type:

```
npm install
```

Factom AccountsJS is now installed and ready to run.

## Running

There are a number of options available to the user. The first two are required, the rest are not:

```
-a, --address: the address you wish to monitor for incoming transactions [required]
-c, --currency: the target fiat currency you are using to account in [required]
-b, --btcex: the exchange you wish to use to get the price of FCT in BTC (defaults to CryptoCompare Current Aggregate)
-f, --fiatex: the exchange you wish to use to get the price of BTC in your target currency (defaults to CryptoCompare Current Aggregate)
-H, --host: the host where your factom walletd instance is operating given in a url format (defaults to http://localhost:8089/v2)
-p, --path: path to output CSV to an additional location (note: account.js will always save the master copy of the CSV to the local folder)
-k, --key: your bitcoin.tax API key
-s, --secret: your bitcoin.tax API secret
-t, --type: your bitcoin.tax transaction type (defaults to 'income' - check the bitcoin.tax [API documentation](https://bitcoin.tax/api) for more options)
```

First, make sure factomd and walletd are running on your target host. Then, appending your preferred options, run:

```
node accounts.js
```

An example command might be:

```
node accounts.js -a FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux -c EUR -b poloniex -p ~
```

A snippet of the expected output to ~/transaction-history.csv would be:

```
date, address, txid, fctReceived, txType, btcExchange, fiatExchange, fiatPrice, fiatValue, currency
2017-02-11, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, a4992bdddfcd1443c87fe8f0a88e6573c09e3988a60c4df68f8968d6148b79ff, 2, General, poloniex, CryptoCompare Aggregate, 3.100662140625, 6.20132428125, EUR
2017-02-14, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, 18bf01b46595a616909bf6eddad761d0cb7d51d16fc0ac4379c060086b4f3923, 600, General, poloniex, CryptoCompare Aggregate, 3.098235870625, 1858.941522375, EUR
2017-02-16, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, 216b07ca7422e5f89834e9443f705f257d3e4411bbd88460f6625ca229a528b6, 560, General, poloniex, CryptoCompare Aggregate, 3.20532521375, 1794.9821197, EUR

```

## Important Notes on Use and Price Data

### Master csv

The master copy of transaction-history.csv lives in the project directory. That csv is used to store the current state and to prevent duplicates. Some people may want to edit the csv file. For example, they might want to delete all transactions they have already exported to Excel so that they can see clearly any new transactions that have arrived.

Editing the master copy of transaction-csv will not work. Instead, it would lead to deleted transactions being imported again, and thus duplicates occurring in your Excel records or in your bitcoin.tax account. If you want to edit the csv file directly, specify a path for a new file using -p. You can edit that copy directly without fear of creating duplicate transactions in your records.

### Price

There is no definitive price for any cryptocurrency. Instead, cryptocurrencies trade on multiple exchanges, which means each exchange has its own price.

This creates a discrepancy between price aggregators depending on which exchanges they use. For example, CoinMarketCap gets the price of FCT from 7 different exchanges, including an exchange in China that non-Chinese people are unlikely to use. CryptoCompare, on the other hand, uses only 5 exchanges, and does not at the time of writing include the aforementioned Chinese exchange.

The result is that the price can sometimes vary dramatically between the two aggregators. Which price is accurate? The aggregator with more exchanges, or the aggregator with exchanges that you as a user can actually access to sell your FCT? The answer is not necessarily clear.

To give you as much control as possible over prices, we have included the -b and -f options, which will allow you to specify which CryptoCompare exchanges to use for both the price of FCT in BTC, and the price of BTC in your target fiat currency. Available exchanges can be found on [CryptoCompare.com](https://www.cryptocompare.com/). If you do not include these options, the price will default to CryptoCompare's aggregate of all listed exchanges.

Finally, accounts.js does have the ability to get prices in any fiat currency where CryptoCompare reports a market in BTC. However, unless your chosen currency has a reasonably large volume of trade, it may not necessarily be wise to exploit that feature. For example, CryptocCompare report that Norwegian Krone (NOK) only trades on LocalBitcoins.com, which is notoriously expensive. Realistically, people accounting against NOK could sell their wares on Bitstamp then convert EUR into NOK at a much better rate. Therefore, they may achieve greater price precision by using account.js with EUR and converting to NOK manually at the last step.

## Authors

* **Alex Carrithers for Factoshi**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

### Warning

Use of this software is entirely at your own risk. It is an alpha release and is likely to contain bugs. Any data it produces may be inaccurate or incomplete.
