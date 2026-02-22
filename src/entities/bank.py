import xrpl.transaction
from xrpl.models import MPTokenIssuanceDestroy, MPTAmount, MPTokenAuthorize
from xrpl.models.requests.ledger_entry import Oracle
from xrpl.models.transactions import MPTokenIssuanceCreate
from xrpl.utils import encode_mptoken_metadata

from .util import mpt_iss_id
from .entity import Entity


class Bank(Entity):
    def __init__(self, private_key):
        super().__init__(private_key)

    def unlock_mpt(self, iss_id):
        transaction = MPTokenAuthorize(
            account=self.wallet.classic_address,
            mptoken_issuance_id=iss_id,
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)

    def get_current_rate(self):
        return int(float(self.client.request(xrpl.models.requests.GetAggregatePrice(
            id="XRP",
            oracles=[Oracle(
                account=self.data['account_data']['Account'],
                oracle_document_id=1
            )],
            base_asset="XRP",
            quote_asset="USD",
        )).result['entire_set']['mean']) * 10 ** 4)

    def create_hold(self, tx_hash):
        data = {
            'ticker': 'HOLDT',
            'name': 'XRP USD hold token',
            'desc': 'Holds a fixed exhange rate between XRP and USD for a specified period',
            'asset_class': 'defi',
            'asset_subclass': 'other',
            'issuer_name': 'unmined.ca',
            'additional_info': {
                'rate': self.get_current_rate(),
                'scale': 4,
                'txn_hash': tx_hash,
            }
        }
        data = encode_mptoken_metadata(data)

        transaction = MPTokenIssuanceCreate(
            account=self.wallet.classic_address,
            mptoken_metadata=data,
        )
        res = xrpl.transaction.sign_and_submit(transaction, self.client, self.wallet, autofill=True)
        res = res.result

        seq = res['tx_json']['Sequence']
        acc = res['tx_json']['Account']
        mpt_id = mpt_iss_id(seq, acc)
        return mpt_id

    def send_hold(self, iss_id, rx_id, qty):
        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=MPTAmount(mpt_issuance_id=iss_id, value=str(qty)),
            destination=rx_id,
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)

    def delete_hold(self, mpt_id):
        transaction = MPTokenIssuanceDestroy(
            account=self.wallet.classic_address,
            mptoken_issuance_id=mpt_id
        )
        req = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        res = xrpl.transaction.submit(req, self.client)
        res = res.result
        return res

    def send_xrp(self, address, tx_hash):
        current_rate = self.get_current_rate() / (10 ** 4)
        txn = self.get_txn(tx_hash)
        iss_id = txn['DeliverMax']['mpt_issuance_id']
        mpt_data = self.get_mpt_meta(iss_id)
        old_rate: float = (float(mpt_data['additional_info']['rate']) /
                           (10 ** float(mpt_data['additional_info']['scale'])))
        qty: int = int(txn['DeliverMax']['value'])

        new_qty = qty * old_rate / current_rate

        transaction = xrpl.models.transactions.Payment(
            account=self.wallet.classic_address,
            amount=str(int(new_qty)),
            destination=address
        )
        res = xrpl.transaction.sign_and_submit(transaction, self.client, self.wallet, autofill=True)
        return res.result['tx_json']['hash']


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
