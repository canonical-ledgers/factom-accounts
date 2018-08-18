# Factoid Address Monitor Daemon

##### factoid-address-monitord

This tool is built for Factom authority node operators and grant recipients to
enable them to record the value of their payouts in a fiat currency of their
choice. It achieves this by watching a specified address on the Factom
blockchain, then outputting a CSV with transaction and price data. It can also
be connected to the bitcoin.tax API to post transaction data directly into your
bitcoin.tax account.

The tool is intended to be left operating so it can check for new transactions
at intervals of five minutes. However, it is also capable of filling in
historic price data for all transactions received at an address. For
transactions less than one week old, it is able to fetch historical price data
per minute. Transactions older than one week can only be matched to hourly
price data, and are therefore naturally less accurate.

This is an example of the CSV the script outputs:

```
date, address, txid, fctReceived, txType, btcExchange, fiatExchange, fiatPrice, fiatValue, currency
2017-02-11, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, a4992bdddfcd1443c87fe8f0a88e6573c09e3988a60c4df68f8968d6148b79ff, 2, General, poloniex, CryptoCompare Aggregate, 3.100662140625, 6.20132428125, EUR
2017-02-14, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, 18bf01b46595a616909bf6eddad761d0cb7d51d16fc0ac4379c060086b4f3923, 600, General, poloniex, CryptoCompare Aggregate, 3.098235870625, 1858.941522375, EUR
2017-02-16, FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux, 216b07ca7422e5f89834e9443f705f257d3e4411bbd88460f6625ca229a528b6, 560, General, poloniex, CryptoCompare Aggregate, 3.20532521375, 1794.9821197, EUR
```

## Installing NodeJS

First, install NodeJS on your system.

#### Ubuntu

```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### MacOS

Visit the NodeJS website to download in the installer package:
https://nodejs.org/en/#download

Alternatively, if you have Homebrew installed:

```
brew install node
```

## Installing Factoid Address Monitor Daemon

Clone the repo into your target directory. Then, navigate into the project
folder and type:

```
npm install
```

## Running

There are a number of options available to the user. The first two are
required, the rest are not:

```
Options:
  --version       Show version number                                  [boolean]
  --address, -a   The address you would like to monitor               [required]
  --currency, -c  The currency you are accounting in, given as three letter code
                  (e.g. USD, GBP, EUR)                                [required]
  --btcex, -b     The exchange you wish to use to get the price of FCT in BTC.
                  Defaults to Cryptocompare Current Aggregate[default: "CCCAGG"]
  --fiatex, -x    The exchange you wish to use to get the price of BTC in your
                  chosen currency. Defaults to Cryptocompare Current Aggregate
                                                             [default: "CCCAGG"]
  --host, -H      The IP of your walletd host. Defaults to localhost
                                                          [default: "localhost"]
  --port, -P      The port to access walletd. Defaults to 8089   [default: 8089]
  --file, -f      CSV file to output and track transaction history    [required]
  --key, -k       Your bitcoin.tax key
  --secret, -S    Your bitcoin.tax secret
  --type, -t      Your bitcoin.tax transaction type. Defaults to `income`. See
                  the bitcoin.tax API docs for details       [default: "Income"]
  --help, -h      Show help                                            [boolean]
```

#### Without PM2 or Systemd

First, make sure factomd and walletd are running on your target host. Then,
appending your preferred options, run:

```
node factoid-address-monitord [options]
```

An example command might be:

```
node factoid-address-monitord -a FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux -c EUR -b poloniex -p ~
```

#### With systemd

You can use the provided systemd service file to have systemd
manage and run this program for you. See [SYSTEMD.md](SYSTEMD.md) for instructions.

#### With PM2

Finally, you can also use PM2. PM2 is a daemon management tool built primarily for Node, but it can also manage other other exectuables (such as Factomd and Walletd). See [PM2.md](PM2.md) for instructions.

## Important Notes on Use and Price Data (please read)

#### Master csv

The CSV pointed to by `--file` is used to store the current state and to
prevent duplicates. Some people may want to edit the csv file. For example,
they might want to delete all transactions they have already exported to Excel
so that they can see clearly any new transactions that have arrived.

If you wish to do this copy the file and edit the copy instead of editing the
file directly.

Editing the main CSV will not work. Instead, it would lead to deleted
transactions being imported again, and thus duplicates occurring in your Excel
records or in your bitcoin.tax account.

#### Price

There is no definitive price for any cryptocurrency. Instead, cryptocurrencies
trade on multiple exchanges, which means each exchange has its own price.

This creates a discrepancy between price aggregators depending on which
exchanges they use. For example, CoinMarketCap gets the price of FCT from 7
different exchanges, including an exchange in China that non-Chinese people are
unlikely to use. CryptoCompare, on the other hand, uses only 5 exchanges, and
does not at the time of writing include the aforementioned Chinese exchange.

The result is that the price can sometimes vary dramatically between the two
aggregators. Which price is accurate? The aggregator with more exchanges, or
the aggregator with exchanges that you as a user can actually access to sell
your FCT? The answer is not necessarily clear.

To give you as much control as possible over prices, we have included the -b
and -f options, which will allow you to specify which CryptoCompare exchanges
to use for both the price of FCT in BTC, and the price of BTC in your target
fiat currency. Available exchanges can be found on
[CryptoCompare.com](https://www.cryptocompare.com/). If you do not include
these options, the price will default to CryptoCompare's aggregate of all
listed exchanges.

Finally, Factoid Address Monitord does have the ability to get prices in any fiat currency
where CryptoCompare reports a market in BTC. However, unless your chosen
currency has a reasonably large volume of trade, it may not necessarily be wise
to exploit that feature. For example, CryptoCompare report that Norwegian Krone
(NOK) only trades on LocalBitcoins.com, which is notoriously expensive.
Realistically, people accounting against NOK would sell their wares on Bitstamp
then convert EUR into NOK at a much better rate. Therefore, they may achieve
greater price precision by using factoid-address-monitord with EUR and
converting to NOK manually at the last step.

## Authors

-   **Alex Carrithers for Factoshi**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE)
file for details

#### Warning

Use of this software is entirely at your own risk. It is an alpha release and
is likely to contain bugs. Any data it produces may be inaccurate or
incomplete.
