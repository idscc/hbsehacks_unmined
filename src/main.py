import os
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


print("Bank balance: ", b.data["account_data"]["Balance"])
print("Client balance: ", c.data["account_data"]["Balance"])

# hold_id = b.create_hold()
# pprint(hold_id)

print(b.delete_hold('00E63BBA2F82769EC014E0C71F3542A6A87F79D444CD733B'))

# pprint(b.get_txns())
if __name__ == '__main__':
    pass