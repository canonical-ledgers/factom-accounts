# Running factoid-address-monitord with PM2

## Installation

First you must install PM2:

```
npm install pm2 -g
```

(Note: You need to run the above command with root permissions)

## Starting

If you are monitoring a remote host, make sure factomd and walletd are running
on that host. If you are running factomd and walletd on the localhost and do
not already have a factomd and walletd running as services on boot, you should
start them in PM2:

```
pm2 start factomd && pm2 start factom-walletd
```

Then, start Factoid Address Monitord using the following command:

```
pm2 start factoid-address-monitord -- [options]
```

An example start command might be:

```
pm2 start factoid-address-monitord -- -a FA21YvXDFPbpFffbSCc7pyV2ie6cgCazacqkBnJJxtwEJvkC39ux -c EUR -b poloniex -p ~
```

Next, save the current process list:

```
pm2 save
```

Finally, to make sure the script, factomd and walletd always start together on
boot, run:

```
pm2 startup
```

then follow the onscreen instructions.
