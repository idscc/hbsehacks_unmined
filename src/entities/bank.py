from pprint import pprint

import xrpl.transaction
from xrpl.models import MPTokenIssuanceDestroy
from xrpl.utils import encode_mptoken_metadata

from src.util import mpt_iss_id
from .entity import Entity
from xrpl.models.transactions import MPTokenIssuanceCreate


class Bank(Entity):
    def __init__(self, private_key):
        super().__init__(private_key)

    def create_hold(self):
        data = {
            'symbol': 'HOLDT',
            'name': 'XRP USD hold token',
            'desc': 'Holds a fixed exhange rate between XRP and USD for a specified period',
            'asset_class': 'defi',
            'asset_subclass': 'other',
            'issuer_name': 'unmined.ca',
            'additional_info': {
                'upx': '1'
            }
        }
        data = encode_mptoken_metadata(data)

        transaction = MPTokenIssuanceCreate(
            account=self.data["account_data"]["Account"],
            mptoken_metadata=data,
        )
        req = xrpl.transaction.autofill_and_sign(transaction, self.client, self.wallet)
        res = xrpl.transaction.submit(req, self.client)
        res = res.result

        seq = res['tx_json']['Sequence']
        acc = res['tx_json']['Account']
        mpt_id = mpt_iss_id(seq, acc)
        return mpt_id

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
