import os
import time
from pprint import pprint

from dotenv import load_dotenv
from xrpl.core.binarycodec import decode
from xrpl.models import MPTokenIssuanceCreate
from xrpl.utils import decode_mptoken_metadata

from src.entities import Bank
from src.entities import Client
from src.util import mpt_iss_id

load_dotenv()

b = Bank(os.getenv("BANK_SECR"))
c = Client(os.getenv("CLIENT_SECR"))

pprint(b.data)
print("Bank balance: ", b.data["account_data"]["Balance"])
print("Client balance: ", c.data["account_data"]["Balance"])

# hold_id = b.create_hold()
# pprint(hold_id)

time.sleep(1)
hold_iss = b.create_hold()

print(c.allow_mpt(hold_iss).result['engine_result'])
print(b.send_hold(hold_iss, c.wallet.classic_address).result['engine_result'])

# pprint(b.get_txns())
if __name__ == '__main__':
    pass
