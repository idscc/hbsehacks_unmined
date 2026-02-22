import os

from dotenv import load_dotenv

from entities import Client

load_dotenv()

c = Client(os.getenv("CLIENT_SECR"))

print("Client balance: ", c.data["account_data"]["Balance"])

print('Client request hold at current rate')
tx_hash = c.send_xrp(os.getenv('BANK_ADDR'), 100)
# get request
print('Client authorizes mpt')
iss_id = input('issuance_id: ')
c.allow_mpt(iss_id)
input('enter to continue')

print('Client requests return')
tx_hash = c.send_hold(os.getenv('BANK_ADDR'), iss_id, 99)
print('Return complete')

if __name__ == '__main__':
    pass
