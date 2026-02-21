import os

from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet, Wallet
from xrpl.core import addresscodec
from xrpl.models.requests.account_info import AccountInfo
import json
from dotenv import load_dotenv, dotenv_values

load_dotenv()

bank_wallet = Wallet.from_secret(os.getenv("BANK_SECR"))

JSON_RPC_URL = "https://lend.devnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

acc_info = client.request(AccountInfo(
    account=bank_wallet.address,
    ledger_index="validated",
    strict=True,
))

print("Response Status: ", acc_info.status)
print(json.dumps(acc_info.result, indent=4, sort_keys=True))

