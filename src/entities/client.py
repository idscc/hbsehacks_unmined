from pprint import pprint

import xrpl
from xrpl.models import MPTAmount

from .entity import Entity


class Client(Entity):
    def __init__(self, private_key):
        super().__init__(private_key)

    def allow_mpt(self, iss_id):
        transaction = xrpl.models.transactions.MPTokenAuthorize(
            account=self.wallet.classic_address,
            mptoken_issuance_id=iss_id,
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)

    def send_hold(self, rx, iss_id, qty):
        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=MPTAmount(mpt_issuance_id=iss_id, value=str(qty)),
            destination=rx,
        )
        return xrpl.transaction.sign_and_submit(transaction, self.client, self.wallet).result['tx_json']['hash']

    def send_xrp(self, address, qty: int):
        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=str(qty),
            destination=address
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        res = xrpl.transaction.submit(transaction, self.client)
        return res.result['tx_json']['hash']


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
