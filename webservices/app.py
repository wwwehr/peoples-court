from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from mangum import Mangum
import os
from pydantic import BaseModel
import requests
from typing import Dict, Any

load_dotenv()


class PinataHandler:
    def __init__(self):
        self.api_key = os.getenv("PINATA_API_KEY")
        self.secret_key = os.getenv("PINATA_SECRET_KEY")
        self.headers = {
            "pinata_api_key": self.api_key,
            "pinata_secret_api_key": self.secret_key,
        }
        self.base_url = "https://api.pinata.cloud"

    async def pin_json(self, name: str, data: Dict[str, Any]) -> str:
        """Upload JSON data to Pinata"""
        try:
            url = f"{self.base_url}/pinning/pinJSONToIPFS"
            response = requests.post(
                url,
                headers=self.headers,
                json={
                    "pinataOptions": {"cidVersion": 1},
                    "pinataMetadata": {"name": name },
                    "pinataContent": data,
                },
            )
            response.raise_for_status()
            return response.json()["IpfsHash"]
        except Exception as e:
            raise Exception(f"Pinata upload failed: {str(e)}")

    async def pin_file(self, files: dict) -> str:
        """Upload file to Pinata"""
        try:
            url = f"{self.base_url}/pinning/pinFileToIPFS"

            response = requests.post(url, headers=self.headers, files=files)
            response.raise_for_status()
            return response.json()["IpfsHash"]
        except Exception as e:
            raise Exception(f"Pinata file upload failed: {str(e)}")

    async def get_json(self, ipfs_hash: str) -> Dict[str, Any]:
        """Get JSON data from Pinata gateway"""
        try:
            url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to retrieve from Pinata: {str(e)}")

    def get_gateway_url(self, ipfs_hash: str) -> str:
        """Get the gateway URL for an IPFS hash"""
        return f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"


class PersonaCreate(BaseModel):
    name: str
    age: int
    occupation: str
    physical_description: str
    image_url: str
    personality: str
    details: dict

class Argument(BaseModel):
    summary: str
    content: str

class Evidence(BaseModel):
    summary: str
    content: str

class Complaint(BaseModel):
    summary: str
    content: str

app = FastAPI(trailing_slash=False)
pinata = PinataHandler()


@app.post("/personas")
async def create_persona(persona: PersonaCreate):
    try:
        # Upload to Pinata
        name = f"{persona.name}.json"
        ipfs_hash = await pinata.pin_json(name, persona.model_dump())

        return {
            "status": "success",
            "ipfs_hash": ipfs_hash,
            "gateway_url": pinata.get_gateway_url(ipfs_hash),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/argument")
async def create_argument(argument: Argument):
    try:
        # Upload to Pinata
        name = f"{argument.summary}.txt"
        ipfs_hash = await pinata.pin_json(name, argument.model_dump())

        return {
            "status": "success",
            "ipfs_hash": ipfs_hash,
            "gateway_url": pinata.get_gateway_url(ipfs_hash),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evidence")
async def create_evidence(evidence: Evidence):
    try:
        # Upload to Pinata
        name = f"{evidence.summary}.txt"
        ipfs_hash = await pinata.pin_json(name, evidence.model_dump())

        return {
            "status": "success",
            "ipfs_hash": ipfs_hash,
            "gateway_url": pinata.get_gateway_url(ipfs_hash),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complaint")
async def create_complaint(complaint: Complaint):
    try:
        # Upload to Pinata
        name = f"{complaint.summary}.txt"
        ipfs_hash = await pinata.pin_json(name, complaint.model_dump())

        return {
            "status": "success",
            "ipfs_hash": ipfs_hash,
            "gateway_url": pinata.get_gateway_url(ipfs_hash),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/image")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Upload to Pinata
        print("starting file pinning")

        input_image_path = os.path.join("/tmp", "image.png")

        with open(input_image_path, "wb") as buffer:
            buffer.write(await file.read())

        files = {"file": (file.filename, open(input_image_path, "rb"))}

        ipfs_hash = await pinata.pin_file(files)

        return {
            "status": "success",
            "ipfs_hash": ipfs_hash,
            "gateway_url": pinata.get_gateway_url(ipfs_hash),
        }
    except Exception as e:
        print(f"FAILED file pinning {e!r}")
        raise HTTPException(status_code=500, detail=str(e))


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path: str):
    return {
        "path": path,
        "method": request.method,
        "url": str(request.url),
        "headers": dict(request.headers),
    }


handler = Mangum(app)
