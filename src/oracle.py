# This is a file to update the current price of USD

import os
import time

import requests
import xrpl.transaction
from dotenv import load_dotenv
from xrpl.models import OracleSet
from xrpl.models.transactions.oracle_set import PriceData

from src.entities import Entity

load_dotenv()
res = requests.get(
    f'https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XRP&to_currency=USD&apikey={os.getenv('STOCK_API_KEY')}'
)

price = int(float(res.json()["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) * 10 ** 4)
print(price)

cli = Entity(os.getenv("BANK_SECR"))

usd_price = PriceData(base_asset="XRP", quote_asset="USD", asset_price=price, scale=4)
transaction = OracleSet(
    account=cli.data["account_data"]["Account"],
    oracle_document_id=1,
    provider="416C7068612056616E74616765",
    last_update_time=int(time.time()),
    asset_class="63757272656E6379",
    price_data_series=[usd_price],
)

transaction = xrpl.transaction.autofill_and_sign(transaction, cli.client, cli.wallet)
xrpl.transaction.submit(transaction, cli.client)
