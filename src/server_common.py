import os
import time

from dotenv import load_dotenv
from xrpl.clients import JsonRpcClient
from xrpl.models import AccountTx

from src.entities import Bank

load_dotenv()

MINIMUM_TIME = 30
ackd_txns = []
ret_qty = None

JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

bank = Bank(os.getenv("BANK_SECR"))


def handle_auth(values):
    tx_hash = values["hash"]
    # print('auth ack', tx_hash)
    iss_id = values['tx_json']['MPTokenIssuanceID']
    acc = values['tx_json']['Account']
    bank.send_hold(iss_id, acc, ret_qty)  # needs to be fixed or multiple requests will overwrite eachother
