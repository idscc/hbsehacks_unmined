from pprint import pprint

from xrpl.clients import JsonRpcClient
from xrpl.models import AccountInfo, AccountTx
from xrpl.wallet import Wallet


class Entity:
    client: JsonRpcClient
    wallet: Wallet

    def __init__(self, private_key):
        JSON_RPC_URL = "https://s.altnet.rippletest.net:51234/"
        self.private_key = private_key
        self.client = JsonRpcClient(JSON_RPC_URL)
        self.wallet = Wallet.from_secret(private_key)

        self.data = self.get_info()

    def get_info(self):
        req = self.client.request(AccountInfo(
            account=self.wallet.address,
            ledger_index="validated",
            strict=True,
        ))
        return req.result

    def get_txns(self):
        req = self.client.request(AccountTx(account=self.wallet.address))
        return req.result


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
