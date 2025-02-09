const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const PeoplesCourtDAO = await ethers.getContractFactory("PeoplesCourtDAO");
  const contractAddress = "0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a";
  const peoplesCourt = PeoplesCourtDAO.attach(contractAddress);

  const addressToLookup = "0xd7eb73bf7d1390ecb91ca1f17845c80de0adef1e5fa438193fc42747d9c5b0c5";

  const personaUri = await peoplesCourt.personaUris(addressToLookup);
  console.log(`Persona URI for ${addressToLookup}: ${personaUri}`);

}

main();
