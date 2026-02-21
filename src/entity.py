from xrpl.clients import JsonRpcClient
from xrpl.models import AccountInfo
from xrpl.wallet import Wallet


class Entity:
    client: JsonRpcClient
    wallet: Wallet

    def __init__(self, private_key):
        JSON_RPC_URL = "https://lend.devnet.rippletest.net:51234"
        self.client = JsonRpcClient(JSON_RPC_URL)
        self.wallet = Wallet.from_secret(private_key)

    def get_info(self):
        return self.client.request(AccountInfo(
            account=self.wallet.address,
            ledger_index="validated",
            strict=True,
        ))
