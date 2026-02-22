import os
import time
from pprint import pprint

from dotenv import load_dotenv

from src.entities import Bank
from src.entities import Client

load_dotenv()

b = Bank(os.getenv("BANK_SECR"))
c = Client(os.getenv("CLIENT_SECR"))

pprint(b.data)
print("Bank balance: ", b.data["account_data"]["Balance"])
print("Client balance: ", c.data["account_data"]["Balance"])

print('Client request hold at current rate')
tx_hash = c.send_xrp(b.wallet.classic_address, 100)
print('Bank sees txn and creates mpt')
iss_id = b.create_hold(tx_hash)  # TODO: add an identifier in metadata
print('Client authorizes mpt')
c.allow_mpt(iss_id)
print('Bank sends mpt')
b.send_hold(iss_id, c.wallet.classic_address, 100)

time.sleep(1)

print('Client requests return')
tx_hash = c.send_hold(b.wallet.classic_address, iss_id, 100)
print('Bank notices and sends back xrp at agreed value')
b.send_xrp(c.wallet.classic_address, tx_hash)

# pprint(b.get_txns())
if __name__ == '__main__':
    pass
