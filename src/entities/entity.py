from xrpl.clients import JsonRpcClient
from xrpl.models import AccountInfo, AccountTx, Tx, LedgerEntry
from xrpl.utils import decode_mptoken_metadata
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
            account=self.wallet.classic_address,
            ledger_index="validated",
            strict=True,
        ))
        return req.result

    def get_txns(self):
        req = self.client.request(AccountTx(account=self.wallet.classic_address))
        return req.result

    def get_txn(self, tx_hash):
        transaction = Tx(
            transaction=tx_hash,
        )
        return self.client.request(transaction).result['tx_json']

    def get_mpt_meta(self, iss_id):
        transaction = LedgerEntry(
            mpt_issuance=iss_id,
        )
        encoded = self.client.request(transaction).result['node']['MPTokenMetadata']
        decoded = decode_mptoken_metadata(encoded)
        return decoded


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
