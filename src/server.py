import os
import time

from dotenv import load_dotenv
from xrpl.clients import JsonRpcClient
from xrpl.models import AccountTx

from entities import Bank

load_dotenv()

MINIMUM_TIME = 30
ackd_txns = []
ret_qty = None

JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

bank = Bank(os.getenv("BANK_SECR"))


def handle_event(values):
    global ret_qty
    tx_hash = values["hash"]
    event = values['tx_json']
    # print(type(event['DeliverMax']))
    match event['DeliverMax']:
        case str():  # xrp to mpt
            qty = int(int(event['DeliverMax']) * 0.995)  # interest is .5%
            ret_qty = qty
            iss_id = bank.create_hold(tx_hash)
            print(f'issuance_id: {iss_id}')
            # bank.send_hold(iss_id, os.getenv('CLIENT_ADDR'), qty)
        case dict():  # mpt to xrp
            # print('mpt', event['DeliverMax'])
            bank.send_xrp(os.getenv('CLIENT_ADDR'), tx_hash)


def handle_auth(values):
    tx_hash = values["hash"]
    # print('auth ack', tx_hash)
    iss_id = values['tx_json']['MPTokenIssuanceID']
    acc = values['tx_json']['Account']
    bank.send_hold(iss_id, acc, ret_qty)  # needs to be fixed or multiple requests will overwrite eachother


def main():
    global ackd_txns, last_used_txn_hash
    while True:
        results = client.request(AccountTx(
            account=os.getenv('BANK_ADDR')
        )).result['transactions']

        for value in results:
            event = value
            value = value['tx_json']
            ctid = value['ctid']
            if ctid in ackd_txns: continue
            ackd_txns.append(ctid)
            if (time.time() - (value['date'] + 946684800)) > MINIMUM_TIME:
                # print('pass')
                continue

            match value['TransactionType']:
                case 'Payment':
                    if value['Destination'] != os.getenv('BANK_ADDR'): continue
                    handle_event(event)
                case 'MPTokenIssuanceCreate':
                    pass
                case 'MPTokenAuthorize':
                    handle_auth(event)

        time.sleep(1)


if __name__ == '__main__':
    main()
