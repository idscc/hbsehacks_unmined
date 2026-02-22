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

    def send_hold(self, iss_id, qty):
        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=MPTAmount(iss_id, qty)
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)

    def send_xrp(self, address, qty: int):
        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=str(qty),
            destination=address
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
