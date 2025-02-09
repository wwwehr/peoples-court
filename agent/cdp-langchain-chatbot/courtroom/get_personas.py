from collections import defaultdict
from cdp import Wallet
from cdp_langchain.tools import CdpTool
from pydantic import BaseModel, Field
import os
import requests
from web3 import Web3


from courtroom.constants import (
    MY_ABI,
)

COURTROOM_GET_ALL_PERSONAS_PROMPT = """
This tool can only be used to perfom a function call on a contract with ETH. Do not use this tool for any other purpose, or trading any assets.

Inputs:
- Courtroom persona contract address

Important notes:
- Only supported on the following networks:
  - Base Sepolia (ie, 'base-sepolia')
"""


class CourtroomGetAllPersonasInput(BaseModel):
    """Input argument schema for get all courtroom personas action."""

    contract_address: str = Field(
        ...,
        description="The courtroom contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`,",
    )


def courtroom_get_all_personas(wallet: Wallet, contract_address: str) -> dict:
    """Get all of the personas uploaded to the courtroom contract.

    Args:
        wallet (Wallet): The wallet to create the token from.
        contract_address (str): The courtroom contract token contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`

    Returns:
        dict: A collection containing all the persona definitions and their courtroom roles

    """
    try:
        w3 = Web3(Web3.HTTPProvider(os.environ["ALCHEMY_API_URL"]))
        contract = w3.eth.contract(address=contract_address, abi=MY_ABI)

        current_id = contract.functions.currentCaseId().call()
        case_info = None
        events = contract.events.CaseCreated.get_logs(from_block=21660147)
        for event in events:
            if event.get("args").get("caseId") == current_id:
                case_info = event.get("args")
                break
        assert case_info is not None, "failed to fetch case info"
        personas = defaultdict(dict)
        events = contract.events.PersonaCreated.get_logs(from_block=21660147)
        for event in events:
            try:
                user = event.get("args").get("user")
                if user not in [case_info.plaintiff, case_info.defendant]:
                    continue
                res = requests.get(event.get("args").get("personaUri"))
                res.raise_for_status()
                personas[user] = res.json()
                personas[user]["COURTROOM_ROLE"] = (
                    "plaintiff" if case_info.plaintiff == user else "defendant"
                )
                personas[user]["WALLET_ADDRESS"] = user
            except Exception as ex:
                print(f"SKIP ENTRY: failed to process event {ex!r}")
                pass
        return personas
    except Exception as e:
        print(f"Error getting all persona onchain {e!s}")
        return {}


def initCourtroomGetAllPersonas(agentkit):
    """Courtroom get all persona definition."""

    return CdpTool(
        cdp_agentkit_wrapper=agentkit,
        name="courtroom_get_all_personas_action",
        description=COURTROOM_GET_ALL_PERSONAS_PROMPT,
        args_schema=CourtroomGetAllPersonasInput,
        func=courtroom_get_all_personas,
    )
