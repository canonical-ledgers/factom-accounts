const fs = require('fs');

const axios = require('axios');
const csv = require('csvtojson');
const yargs = require('yargs');

const { FactomCli } = require('factom');

const argv = yargs
    .options({
        address: {
            demand: true,
            alias: 'a',
            describe: 'The address you would like to monitor'
        },
        currency: {
            demand: true,
            alias: 'c',
            describe: 'The currency you are accounting in, given as three letter code (e.g. USD, GBP, EUR)'
        },
        btcex: {
            demand: false,
            alias: 'b',
            describe: 'The exchange you wish to use to get the price of FCT in BTC. Defaults to Cryptocompare Current Aggregate'
        },
        fiatex: {
            demand: false,
            alias: 'f',
            describe: 'The exchange you wish to use to get the price of BTC in your chosen currency. Defaults to Cryptocompare Current Aggregate'
        },
        host: {
            demand: false,
            alias: 'H',
            describe: 'The IP of your walletd host. Defaults to localhost',
            default: 'localhost'
        },
        port: {
            demand: false,
            alias: 'p',
            describe: 'The port to access walletd. Defaults to 8089',
            default: 8089
        },
        file: {
            demand: false,
            alias: 'f',
            describe: 'Path to output CSV to an additional location (note: account.js will always save the master copy of the CSV to the local folder)'
        },
        key: {
            demand: false,
            alias: 'k',
            describe: 'Your bitcoin.tax key'
        },
        secret: {
            demand: false,
            alias: 'S',
            describe: 'Your bitcoin.tax secret'
        },
        type: {
            demand: false,
            alias: 't',
            describe: 'You bitcoin.tax transaction type. Defaults to `income`. See the bitcoin.tax API docs for details'
        },
    })
    .help()
    .alias('help', 'h')
    .argv;

const cli = new FactomCli({
    walletd: {
        host: argv.host,
        port: argv.port,
    }
});

console.log('Checking for new transactions at one minute intervals...');

async function checkForNewTx(currentCsvState) {
    try {
        const tx = await cli.walletdApi('transactions', {address: argv.address});
        const receivedArr = [];

        for (const transaction of tx.transactions) {
            if (transaction.outputs
            && transaction.outputs.some(el => el.address === argv.address)
            && receivedArr.every((el) => el.txid !== transaction.txid)
            && currentCsvState.every((el) => el.txid !== transaction.txid)) {
                const apiHistoryPeriod = Date.now() - transaction.timestamp * 1000 > 600000000 ? 'hour' : 'minute';
                const fiatPrice = await apiCallWithRetry(apiHistoryPeriod, transaction.timestamp);
                if (fiatPrice !== undefined) { //prevents api error writing false values to logs
                    receivedArr.unshift({
                        date: new Date(transaction.timestamp * 1000).toISOString(),
                        address: argv.address,
                        txid: transaction.txid,
                        fctReceived: transaction.outputs
                            .filter(output => output.address === argv.address)
                            .map(output => output.amount * Math.pow(10, -8))
                            .reduce((sum, current) => sum + current, 0),
                        txType: transaction.inputs !== null ? 'Non-Coinbase' : 'Coinbase',
                        btcExchange: argv.btcex === undefined ? 'CryptoCompare Aggregate' : argv.btcex,
                        fiatExchange: argv.fiatex === undefined ? 'CryptoCompare Aggregate' : argv.fiatex,
                        fiatPrice,
                        get fiatValue() { return this.fctReceived * fiatPrice },
                        currency: argv.currency.toUpperCase()
                    });
                }
            }
        }

        if (receivedArr[0] !== undefined) {
            console.log(`Found new transaction(s): \n${JSON.stringify(receivedArr, undefined, 2)}`);

            for (const item of receivedArr) {
                const csvData = `${item.date.slice(0, 10)}, ${argv.address}, ${item.txid}, ${item.fctReceived}, ${item.txType}, ${item.btcExchange}, ${item.fiatExchange}, ${item.fiatPrice}, ${item.fiatValue}, ${item.currency}\n`;
                fs.appendFileSync('transaction-history.csv', csvData);
                if (argv.path !== undefined) {
                    fs.appendFileSync(`${argv.path}/transaction-history.csv`, csvData);
                }
            }
            console.log('Written new transaction(s) to csv');

            if (argv.key !== undefined) {
                await apiCallWithRetry('postBitcoinTax', receivedArr);
                console.log('Posted new transaction(s) to bitcoin.tax');
            }
            console.log('Waiting for new transactions...');
        }
    } catch(err) {
        clearInterval(checkTransactionInterval);
        console.warn('Transaction history may be inaccurate or incomplete...');
        console.error(err);
    }
}

async function apiCallWithRetry(type, objParam) {
    function wait (timeout) {
        return new Promise(resolve => setTimeout(() => resolve(), timeout));
    }

    for (let i = 0; i <= 10; i++) {
        try {
            if (type === 'hour' || type === 'minute') {
                const exchangeBtc = argv.btcex === undefined ? 'CCCAGG' : argv.btcex;
                const exchangeFiat =  argv.fiatex === undefined ? 'CCCAGG' : argv.fiatex;
                const histBtc = await axios.get(`https://min-api.cryptocompare.com/data/histo${type}?fsym=FCT&tsym=BTC&limit=0&aggregate=1&toTs=${objParam}&e=${exchangeBtc}`);
                const histFiat = await axios.get(`https://min-api.cryptocompare.com/data/histo${type}?fsym=BTC&tsym=${argv.currency}&limit=0&aggregate=1&toTs=${objParam}&e=${exchangeFiat}`);
                const avgBtcPrice = (histBtc.data.Data[1].high + histBtc.data.Data[1].low + histBtc.data.Data[1].open + histBtc.data.Data[1].close) / 4;
                const avgFiatPrice = (histFiat.data.Data[1].high + histFiat.data.Data[1].low + histFiat.data.Data[1].open + histFiat.data.Data[1].close) / 4;
                const priceEstimate = avgFiatPrice * avgBtcPrice;
                return priceEstimate;
            } else if (type === 'postBitcoinTax') {
                const bitcoinTaxArr = [];
                objParam.forEach(item => {
                    bitcoinTaxArr.push({
                        date: item.date,
                        action: argv.type === undefined ? 'Income' : argv.type,
                        symbol: 'FCT',
                        currency: `${argv.currency}`,
                        volume: item.fctReceived,
                        price: item.fiatPrice,
                        txhash: item.txid,
                        recipient: argv.address
                    });
                });

                const options = {
                    method: 'POST',
                    url: 'https://api.bitcoin.tax/v1/transactions',
                    data: bitcoinTaxArr,
                    headers: {
                        'User-Agent': 'axios/0.18.0',
                        'X-APIKEY': `${argv.key}`,
                        'X-APISECRET': `${argv.secret}`
                    },
                    json: true
                };
                return await axios(options);
            }
        } catch (err) {
            const timeout = Math.pow(2, i);
            await wait(timeout);
            if (i === 10) {
                clearInterval(checkTransactionInterval);
                if (err.hostname === 'min-api.cryptocompare.com') {
                    return console.error(`Error: failed to connect to ${err.hostname}`);
                } else if (err.config.url === 'https://api.bitcoin.tax/v1/transactions') {
                    return console.error('Error: failed to connect to bitcoin.tax. Remove above transaction(s) from master CSV before restarting accounts.js');
                }
            }
        }
    }
}

// function test() {
const checkTransactionInterval = setInterval(async () => {
    const currentFileState = [];
    if (fs.existsSync('./transaction-history.csv')) {
        const csvFilePath = './transaction-history.csv';
        csv()
            .fromFile(csvFilePath)
            .on('json', csvRow => currentFileState.push(csvRow))
            .on('done', () => checkForNewTx(currentFileState));
    } else {
        console.log('Initialising new CSV');
        const csvInit = 'date, address, txid, fctReceived, txType, btcExchange, fiatExchange, fiatPrice, fiatValue, currency\n';
        fs.writeFileSync('./transaction-history.csv', csvInit);
        if (argv.path !== undefined) {
            fs.writeFileSync(`${argv.path}/transaction-history.csv`, csvInit);
        }
        checkForNewTx(currentFileState);
    }
}, 60000);
// }

// test();
