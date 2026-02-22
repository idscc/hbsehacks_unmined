# unmined

###### An automated banking system powered by the XRP ledger. Made for NSBEHacks 2026

## Purpose

This system is designed to hold an amount of XRP at the current exchange rate of USD to XRP, and when withdrawn, a new
amount is calculated with the formula
$$ReturnedAmount = \frac{R_o}{R_c}DepositedAmount\tag{1}$$ (1)
where $R_o$ is the old rate that the transaction was held at, and $R_c$ is the current market rate. This is such that
the net equivalent value of XRP is returned instead of a value that can have inflated or deflated. Since XRP is a
deflationary currency, the limit of holding is 1 year, where afterward the tokens are clawed back and the funds are
returned to the owner.

## How it works

The main operating principle of unmined is the use of Multi-Purpose Tokens (MPTs) that due to their ability to hold
metadata, are used to retain the price that the original transaction was made at for further calculation later. The main
framework goes as follows:

1. Client sends payment to a predetermined wallet <br> This wallet is watched by the server for when unsolicited XRP
   transactions are made. when this happens, the surcharge is calculated out of the payment and the system moves onto
   step 2.
2. An MPT is generated for this transaction set <br> This MPT logs the current exchange rate and returns an MPT issuance
   ID for the client to authorize.
3. Client authorizes the MPT for transaction <br> This is a requirement of the XRPL and as of current we did not find
   a way to get around this. maybe an AMM (AutomatedMarketMaker)? <br> The server watches for this action to be taken
   and
   automatically goes to step 4.
4. Server issues a quantity of the MPT <br> The amount is the same as the initial principle - surcharge (0.5%). This
   is done for easier calculations later.
5. The MPTs are held by the client until they wish to withdraw some or all of it (after a waiting period of 1 hour) or
   until a year when it is force refunded. <br> In order to withdraw the client just needs to transfer the MPTs back to
   the
   server address it initially deposited to.
6. Server automatically notices the withdrawal attempt, it will send back the funds using equation 1.

## Scripts

| Name             | Function                                                                                                                |
|------------------|-------------------------------------------------------------------------------------------------------------------------|
| main.py          | runs a commandline based client that automatically does a full deposit and withdraw sequence, ignoring the time limits. |
| oracle.py        | updates the on-chain oracle for XRP-USD exchange rate.                                                                  |
| server.py        | runs the backend for the functions                                                                                      |
| api_serv.py      | runs the backend as a rest api, see [API.md](./api.md) for endpoints                                                    |
| server_common.py | DO NOT RUN, purely for file simplification                                                                              |
| entities/        | contains classes of the bank and client varieties, the site Client.js and Entity.js are based off these                 |

## Future Plans
The goal for this system is for it to be fully automated and extremely scalable. Since there is already minimal input by
users and none by server admin, it already has a high degree of automation, though a way to not require the user
authorize MPT transaction, which would save requests to the chain.

### Scalability
The server is already running on a server in my basement through a reverse proxy load balancer called traefik. 
Through this more servers can be added to work in parallel, allowing for higher traffic loads. It can also be 
distributed easily through those containers to other servers around the world

## Running

### Minimal test

1. In order to run a minimal test, first install requirements:
    ```shell
    git clone https://github.com/idscc/hbsehacks_unmined.git unmined
    cd unmined
    python -m venv .venv
    source .venv/Scripts/activate # depends on OS and shell
    pip install -r requirements.txt
    ```

2. Create a .env file in the root directory with the following values

   | key           | value                                                                 |
            |---------------|-----------------------------------------------------------------------|
   | BANK_SECR     | Bank Secret Key                                                       |
   | BANK_ADDR     | Bank Public Address                                                   |
   | CLIENT_SECR   | Client Secret Key                                                     |
   | CLIENT_ADDR   | Client Public Address                                                 |
   | STOCK_API_KEY | [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) |

3. Update the oracle
   ```shell
   python ./src/oracle.py
   ```
4. Start the server
   ```shell
   python ./src/server.py
   ```
5. In another shell, start the client
   ```shell
   python ./src/client.py
   ```
6. View the results on https://testnet.xrpl.org/ and look for the public ids of the bank and client

#### Note

When running this example, it is slightly interactive, as although the server and client are independent when running
(they only interact over XRPL), in order to authorize the transaction the client must somehow acquire the MPT issuance
ID. So take note that once the client does the initial transaction, the server will generate the MPT issuance ID and
print it out as

```bash
issuance_id <MPT_issuance_id>
```

Copy it and paste it into the client when prompted. the rest is automated

### UI ([online](https://unmined.ca))

This project also has an experimental frontend. In order to use it, do steps 1-3 of the [minimal test](#minimal-test),
then

1. Install node.js
   ```shell
   cd site/
   npm init .
   ```
2. Follow the instructions in the [site folder](./site/README.md)

#### Note

* The commandline method or manually sending back an MPT is more robust


## BUGS IN XRPL DOCS
* have to generate mpt_issuance_id manually in python for some reason
