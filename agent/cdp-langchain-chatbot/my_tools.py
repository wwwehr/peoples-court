import requests
import io
import json
import os
from langchain_core.callbacks import (
    CallbackManagerForToolRun,
)
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from huggingface_hub import InferenceClient
from typing import Optional


def upload_evidence(evidence_one_sentence_summary: str, evidence_story: str) -> str:
    MY_API_BASE = os.environ["MY_API_BASE"]

    print("fn:upload_evidence: storing struct to pinata")
    payload = {"summary": evidence_one_sentence_summary, "content": evidence_story}
    print(json.dumps(payload, indent=4))
    response = requests.post(
        f"{MY_API_BASE}/evidence",
        json=payload,
    )

    if response.status_code == 200:
        result = response.json()
        print(f"content saved: {result['gateway_url']}")
        return result["gateway_url"]
    else:
        print("Upload failed:", response.text)
        return ""

class UploadEvidenceInput(BaseModel):
    evidence_one_sentence_summary: str = Field(
        "A one sentence summary of the evidence lodged between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )
    evidence_story: str = Field(
        "The total narrative of the evidence between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )


class UploadEvidenceTool(BaseTool):
    name: str = "upload_evidence_tool"
    description: str = (
        """Upload completely creative narrative to support the your claims and protect yourself from your opponent, but also to weaken their position and claims. It should be bombastic and hallmark of the Jerry Springer television entertainment program. Do not use names or pronouns, but instead use PLAINTIFF and DEFENDANT"""
    )
    args_schema: type[BaseModel] = UploadEvidenceInput
    return_direct: bool = True

    def _run(
        self,
        evidence_one_sentence_summary: str,
        evidence_story: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:

        return upload_evidence(
            evidence_one_sentence_summary=evidence_one_sentence_summary,
            evidence_story=evidence_story,
        )

def upload_argument(argument_one_sentence_summary: str, argument_story: str) -> str:
    MY_API_BASE = os.environ["MY_API_BASE"]

    print("fn:upload_argument: storing struct to pinata")
    payload = {"summary": argument_one_sentence_summary, "content": argument_story}
    print(json.dumps(payload, indent=4))
    response = requests.post(
        f"{MY_API_BASE}/argument",
        json=payload,
    )

    if response.status_code == 200:
        result = response.json()
        print(f"content saved: {result['gateway_url']}")
        return result["gateway_url"]
    else:
        print("Upload failed:", response.text)
        return ""

class UploadArgumentInput(BaseModel):
    argument_one_sentence_summary: str = Field(
        "A one sentence summary of the argument lodged between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )
    argument_story: str = Field(
        "The total narrative of the argument between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )


class UploadArgumentTool(BaseTool):
    name: str = "upload_argument_tool"
    description: str = (
        """Upload completely creative narrative to support the your claims and protect yourself from your opponent, but also to weaken their position and claims. It should be bombastic and hallmark of the Jerry Springer television entertainment program. Do not use names or pronouns, but instead use PLAINTIFF and DEFENDANT"""
    )
    args_schema: type[BaseModel] = UploadArgumentInput
    return_direct: bool = True

    def _run(
        self,
        argument_one_sentence_summary: str,
        argument_story: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:

        return upload_argument(
            argument_one_sentence_summary=argument_one_sentence_summary,
            argument_story=argument_story,
        )

def upload_complaint(complaint_one_sentence_summary: str, complaint_story: str) -> str:
    MY_API_BASE = os.environ["MY_API_BASE"]

    print("fn:upload_complaint: storing struct to pinata")
    payload = {"summary": complaint_one_sentence_summary, "content": complaint_story}
    print(json.dumps(payload, indent=4))
    response = requests.post(
        f"{MY_API_BASE}/complaint",
        json=payload,
    )

    if response.status_code == 200:
        result = response.json()
        print(f"content saved: {result['gateway_url']}")
        return result["gateway_url"]
    else:
        print("Upload failed:", response.text)
        return ""


def upload_persona(persona_struct: dict) -> str:
    MY_API_BASE = os.environ["MY_API_BASE"]

    print("fn:upload_persona_tool: storing struct to pinata")
    print(json.dumps(persona_struct, indent=4))
    response = requests.post(f"{MY_API_BASE}/personas", json=persona_struct)

    if response.status_code == 200:
        result = response.json()
        print(f"content saved: {result['gateway_url']}")
        return result["gateway_url"]
    else:
        print("Upload failed:", response.text)
        return ""


def create_persona_image(person_name: str, persona_struct: str) -> str | None:
    MY_API_BASE = os.environ["MY_API_BASE"]

    client = InferenceClient(
        provider="fal-ai", api_key=os.environ["HUGGINGFACE_API_KEY"]
    )

    PROMPT = f"""
        photo realistic front facing capture of a person 
        entering a courtroom who is fully described as 
        {persona_struct}"""

    print("fn:create_persona_image: starting image gen")
    image = client.text_to_image(PROMPT, model="black-forest-labs/FLUX.1-dev")

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="PNG")
    img_byte_arr = img_byte_arr.getvalue()

    files = {"file": (person_name + ".png", img_byte_arr, "image/png")}

    print("fn:create_persona_image: storing image to pinata")
    response = requests.post(f"{MY_API_BASE}/image", files=files)

    if response.status_code == 200:
        result = response.json()
        print(f"image saved: {result['gateway_url']}")
        return result["gateway_url"]
    else:
        print("Upload failed:", response.text)


def create_persona(persona_description) -> dict | None:
    """Create a persona that will be either plaintiff or defendant"""
    print(f"fn:create_persona [{persona_description}]")
    try:
        HUGGINGFACE_API_KEY = os.environ["HUGGINGFACE_API_KEY"]
        """
        MY_API_BASE = os.environ["MY_API_BASE"]
        MY_API_TOKEN = os.environ["MY_API_TOKEN"]


        headers = {
            "Authorization": f"Bearer {MY_API_TOKEN}",
            "Content-Type": "application/json",
        }

        response = requests.get(f"{MY_API_BASE}/api/v1/schemas", headers=headers)

        assert (
            response.status_code == 200 and response.json().get("errors", []) == []
        ), response.content.decode("utf8")

        schema_list = response.json()["data"]
        assert len(schema_list) > 0, "failed to fetch schemas from nildb"
        """

        schema_prompt = f"""
        1. I'll provide you with a description of the persona I want to create
        2. You will take this description and creatively fill out a robust profile
           that matches or exceeds the detail found in the provided example
        3. Do not include explanation or comments. Only a string that can be
           deserialized
        4. Can be either man or woman
        5. Person should not be fancy or posh. Just a regular, run of the mill citizen
           from American midwest or Florida-type society. Definitely the type of 
           person that shops at Walmart.
        6. Never include punctuation like quotes or single quotes. Spell out feet and inches

        PERSONA EXAMPLE:
        {{
          name: "Sarah Chen",
          age: "34",
          occupation: "Food Truck Owner",
          physical_description: "Stark black hair, brown eyes, short stature. Pent up energy ready to explode.",
          personality: "Determined, quick-witted, sometimes stubborn. Values family traditions but seeks to modernize them.",
          details: {{
            children: 1,
            criminal_background: "clean",
            personalHistory: "Born to immigrant parents who ran a restaurant in Flushing. Learned cooking from grandmother. Started food truck business after culinary school debt forced restaurant dreams to be put on hold.",
            motivations: "Wants to prove that modern fusion cuisine can honor traditional recipes. Dreams of opening her own restaurant.",
            relationships: "Close with grandmother (mentor), competitive with sister (successful restaurant owner), supportive parents who don't quite understand fusion cuisine",
            quirks: "Names all her cooking utensils. Refuses to cook on Mondays due to family superstition.",
            location: "Brooklyn, NY",
          }}
        }};

        DESIRED PERSONA DESCRIPTION:
        {persona_description}
        """

        client = InferenceClient(api_key=HUGGINGFACE_API_KEY)

        stream = client.chat.completions.create(
            model="google/gemma-2-2b-it",
            messages=[{"role": "user", "content": schema_prompt}],
            max_tokens=500,
            stream=True,
        )

        result = "".join([chunk.choices[0].delta.content for chunk in stream])

        return result

    except Exception as e:
        print(f"Error generating persona: {e!r}")
        return None


class CreatePersonaInput(BaseModel):
    persona_description: str = Field(
        description="a comprehensive and creative description of a random person who is about to be seen in court!"
    )


class CreatePersonaTool(BaseTool):
    name: str = "create_persona_tool"
    description: str = (
        """Create a highly descriptive persona of an adult person who is about to be seen in the courtroom and must include as much detail of personality quirks as possible. They are an average type of person. Middle or lower class."""
    )
    args_schema: type[BaseModel] = CreatePersonaInput
    return_direct: bool = False

    def _run(
        self,
        persona_description: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> dict | None:

        return create_persona(persona_description=persona_description)


class UploadPersonaInput(BaseModel):
    persona_image_url: str = Field("The url result of the create_persona_image_tool")
    persona_struct: str = Field(
        description="""All persona details in the following JSON format:
        {{
            "name": "PLACEHOLDER_FULL_NAME",
            "age": "PLACEHOLDER_AGE",
            "occupation": "PLACEHOLDER_OCCUPATION",
            "physical_description": "PLACEHOLDER_PHYSICAL_DESCRIPTION",
            "personality": "PLACEHOLDER_PERSONALITY",
            "details": {{
              "children": PLACEHOLDER_CHILDREN_COUNT,
              "criminal_background": "PLACEHOLDER_CRIMINAL_BACKGROUND",
              "personalHistory": "PLACEHOLDER_PERSONAL_HISTORY",
              "motivations": "PLACEHOLDER_MOTIVATIONS",
              "relationships": "PLACEHOLDER_RELATIONSHIPS",
              "quirks": "PLACEHOLDER_QUIRKS",
              "location": "PLACEHOLDER_LOCATION"
            }}
        }}"""
    )


class UploadPersonaTool(BaseTool):
    name: str = "upload_persona_tool"
    description: str = (
        """Upload complete persona to a decentralized image of the courtroom participant; all details are to be serialized in the JSON schema provided. The output is a URL of the persona"""
    )
    args_schema: type[BaseModel] = UploadPersonaInput
    return_direct: bool = True

    def _run(
        self,
        persona_image_url: str,
        persona_struct: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:

        print(f"validate: {persona_struct}")
        valid_struct = json.loads(persona_struct)
        return upload_persona(
            persona_struct={"image_url": persona_image_url, **valid_struct}
        )


class UploadComplaintInput(BaseModel):
    complaint_one_sentence_summary: str = Field(
        "A one sentence summary of the complaint lodged between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )
    complaint_story: str = Field(
        "The total narrative of the complaint between two individuals without names but using PLAINTIFF and DEFENDANT instead."
    )


class UploadComplaintTool(BaseTool):
    name: str = "upload_complaint_tool"
    description: str = (
        """Upload completely creative narrative about a conflict between two private individuals. This problem will lead them to small claims court. It should be bombastic and hallmark of the Jerry Springer television entertainment program. Do not use names, but instead use PLAINTIFF and DEFENDANT"""
    )
    args_schema: type[BaseModel] = UploadComplaintInput
    return_direct: bool = True

    def _run(
        self,
        complaint_one_sentence_summary: str,
        complaint_story: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:

        return upload_complaint(
            complaint_one_sentence_summary=complaint_one_sentence_summary,
            complaint_story=complaint_story,
        )


class CreatePersonaImageInput(BaseModel):
    persona_struct: str = Field(
        description="a detailed persona output structure result of the create_persona_tool"
    )
    person_name: str = Field(
        description="the name of the person derived from the persona_struct"
    )


class CreatePersonaImageTool(BaseTool):
    name: str = "create_persona_image_tool"
    description: str = (
        """Create a decentralized image of the courtroom participant and receive an image gateway url. When it fails, you should retry up to three times."""
    )
    args_schema: type[BaseModel] = CreatePersonaImageInput
    return_direct: bool = False

    def _run(
        self,
        person_name: str,
        persona_struct: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str | None:

        return create_persona_image(
            person_name=person_name, persona_struct=persona_struct
        )
