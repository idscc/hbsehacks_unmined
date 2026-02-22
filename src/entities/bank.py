import time
from pprint import pprint

import xrpl.transaction
from xrpl.models import MPTokenIssuanceDestroy, Payment, Transaction, MPTAmount, MPTokenAuthorize
from xrpl.models.requests.ledger_entry import Oracle
from xrpl.utils import encode_mptoken_metadata

from src.util import mpt_iss_id
from .entity import Entity
from xrpl.models.transactions import MPTokenIssuanceCreate


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

    def create_hold(self):
        price = int(float(self.client.request(xrpl.models.requests.GetAggregatePrice(
            id="XRP",
            oracles=[Oracle(
                account=self.data['account_data']['Account'],
                oracle_document_id=1
            )],
            base_asset="XRP",
            quote_asset="USD",
        )).result['entire_set']['mean']) * 10 ** 4)
        print(price)
        data = {
            'ticker': 'HOLDT',
            'name': 'XRP USD hold token',
            'desc': 'Holds a fixed exhange rate between XRP and USD for a specified period',
            'asset_class': 'defi',
            'asset_subclass': 'other',
            'issuer_name': 'unmined.ca',
            'additional_info': {
                'exchange': price,
                'scale': 4
            }
        }
        data = encode_mptoken_metadata(data)

        transaction = MPTokenIssuanceCreate(
            account=self.data["account_data"]["Account"],
            mptoken_metadata=data,
            maximum_amount='1000',
            # flags=0x7C,
        )
        req = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        res = xrpl.transaction.submit(req, self.client)
        res = res.result

        seq = res['tx_json']['Sequence']
        acc = res['tx_json']['Account']
        mpt_id = mpt_iss_id(seq, acc)
        return mpt_id

    def send_hold(self, iss_id, rx_id):
        transaction = xrpl.models.transactions.Payment(
            account=self.data["account_data"]["Account"],
            amount=MPTAmount(mpt_issuance_id=iss_id, value="100"),
            destination=rx_id,
        )
        transaction = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        return xrpl.transaction.submit(transaction, self.client)

    def delete_hold(self, mpt_id):
        transaction = MPTokenIssuanceDestroy(
            account=self.data["account_data"]["Account"],
            mptoken_issuance_id=mpt_id
        )
        req = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        res = xrpl.transaction.submit(req, self.client)
        res = res.result
        return res


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
