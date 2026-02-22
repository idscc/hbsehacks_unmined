import threading
import time

from flask import Flask, request
from xrpl.models import AccountTx

from server_common import *

api = Flask(__name__)

pending_iss = dict()


def handle_recv(values):
    global ret_qty
    tx_hash = values["hash"]
    event = values['tx_json']
    match event['DeliverMax']:
        case str():  # xrp to mpt
            qty = int(int(event['DeliverMax']) * 0.995)  # interest is .5%
            ret_qty = qty
            iss_id = bank.create_hold(tx_hash)
            print(f'issuance_id: {iss_id}')
            pending_iss[event['Account']] = iss_id
        case dict():  # mpt to xrp
            addr = bank.get_txn(tx_hash)['Account']
            bank.send_xrp(addr, tx_hash)


def main():
    global ackd_txns
    while True:
        results = client.request(AccountTx(
            account=bank.wallet.classic_address,
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
                    if value['Destination'] != bank.wallet.classic_address: continue
                    handle_recv(event)
                case 'MPTokenIssuanceCreate':
                    pass
                case 'MPTokenAuthorize':
                    handle_auth(event)

        time.sleep(1)


@api.route('/iss', methods=['GET'])
def get_iss():
    lookup = request.args.get('iss_id')
    if lookup not in pending_iss:
        print('No pending issuance')
        return {'mpt': 0}
    return {'mpt': pending_iss[lookup]}


def api_run():
    api.run()


if __name__ == '__main__':
    flask_thread = threading.Thread(target=api_run)
    flask_thread.start()
    main()
