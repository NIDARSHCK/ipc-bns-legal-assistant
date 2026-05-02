IPC_TO_BNS = {
    "302": "103",
    "420": "318",
    "379": "303",
    "376": "63",
    "406": "316",
    "34": "3(5)",
}

BNS_TO_IPC = {v: k for k, v in IPC_TO_BNS.items()}


def get_equivalent_section(section: str, act: str):
    section = str(section)

    if act == "IPC":
        return IPC_TO_BNS.get(section)

    return BNS_TO_IPC.get(section)