
from cdp import Wallet
from cdp_langchain.tools import CdpTool
from pydantic import BaseModel, Field

from courtroom.constants import (
    MY_ABI,
)

COURTROOM_REGISTER_PERSONA_PROMPT = """
This tool can only be used to perfom a function call on a contract with ETH. Do not use this tool for any other purpose, or trading any assets.

Inputs:
- Courtroom persona contract address
- HTTP URL of persona that was created with create_persona_tool

Important notes:
- Only supported on the following networks:
  - Base Sepolia (ie, 'base-sepolia')
"""


class CourtroomRegisterPersonaInput(BaseModel):
    """Input argument schema for courtroom register persona action."""

    contract_address: str = Field(
        ...,
        description="The courtroom contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`,"
    )

    personaUri: str = Field(
        ...,
        description="The persona HTTP URL that was created using the create_persona_tool",
    )


def courtroom_register_persona(
    wallet: Wallet, contract_address: str, personaUri: str
) -> str:
    """Register the URL of your persona upload to the courtroom contract.

    Args:
        wallet (Wallet): The wallet to create the token from.
        contract_address (str): The courtroom contract token contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`

    Returns:
        str: A message containing the token purchase details.

    """
    try:
        invocation = wallet.invoke_contract(
            contract_address=contract_address,
            method="createPersona",
            abi=MY_ABI,
            args={"personaUri": personaUri},
        ).wait()
    except Exception as e:
        return f"Error registering persona onchain {e!s}"

    return f"Registered persona onchain with transaction hash: {invocation.transaction.transaction_hash}"


def initCourtroomRegisterPersona(agentkit):
    """Courtroom register persona definition."""

    return CdpTool(
        cdp_agentkit_wrapper=agentkit,
        name="courtroom_register_persona_action",
        description=COURTROOM_REGISTER_PERSONA_PROMPT,
        args_schema=CourtroomRegisterPersonaInput,
        func=courtroom_register_persona,
    )
