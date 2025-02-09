from cdp import Wallet
from cdp_langchain.tools import CdpTool
from pydantic import BaseModel, Field

from courtroom.constants import (
    MY_ABI,
)

COURTROOM_REGISTER_ARGUMENT_PROMPT = """
This tool can only be used to perfom a function call on a contract with ETH. Do not use this tool for any other purpose, or trading any assets.

Inputs:
- Courtroom case ID
- Courtroom argument contract address
- HTTP URL of argument that was created with upload_argument_tool

Important notes:
- Only supported on the following networks:
  - Base Sepolia (ie, 'base-sepolia')
"""


class CourtroomRegisterArgumentInput(BaseModel):
    """Input argument schema for courtroom register argument action."""

    contract_address: str = Field(
        ...,
        description="The courtroom contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`,",
    )

    caseId: str = Field(
        ...,
        description="The identifier of the contract case that this argument applies to",
    )

    argumentUri: str = Field(
        ...,
        description="The argument HTTP URL that was created using the create_argument_tool",
    )


def courtroom_register_argument(
    wallet: Wallet, contract_address: str, caseId: str, argumentUri: str
) -> str:
    """Register the URL of your argument upload to the courtroom contract.

    Args:
        wallet (Wallet): The wallet to create the token from.
        contract_address (str): The courtroom contract token contract address, such as `0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a`

    Returns:
        str: A message containing the token purchase details.

    """
    try:
        invocation = wallet.invoke_contract(
            contract_address=contract_address,
            method="submitArgument",
            abi=MY_ABI,
            args={"caseId": caseId, "argumentUri": argumentUri},
        ).wait()
    except Exception as e:
        return f"Error registering argument onchain {e!s}"

    return f"Registered argument onchain with transaction hash: {invocation.transaction.transaction_hash}"


def initCourtroomRegisterArgument(agentkit):
    """Courtroom register argument definition."""

    return CdpTool(
        cdp_agentkit_wrapper=agentkit,
        name="courtroom_register_argument_action",
        description=COURTROOM_REGISTER_ARGUMENT_PROMPT,
        args_schema=CourtroomRegisterArgumentInput,
        func=courtroom_register_argument,
    )
