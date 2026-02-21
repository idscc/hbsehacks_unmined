import xrpl


def mpt_iss_id(seq, iss_id):
    s = '' + hex(seq) + xrpl.core.addresscodec.decode_classic_address(iss_id).hex()
    s = s.upper()
    s = s[2:]
    s = s.zfill(48)
    return s