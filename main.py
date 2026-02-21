from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.core import addresscodec
from xrpl.models.requests.account_info import AccountInfo
import json

JSON_RPC_URL = "https://lend.devnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

