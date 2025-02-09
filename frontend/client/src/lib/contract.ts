import { ethers, isAddress } from "ethers";

import PeoplesCourtABI from "./PeoplesCourtDAO.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const CONTRACT_ADDRESS = "0xD1Bdb459928A66682A98f15DDE2c07b252Eec04a";

export type Case = {
  id: number;
  title: string;
  caseUri: string;
  plaintiff: string;
  defendant: string;
  startTime: number;
  endTime: number;
  prizePool: bigint;
  nftId: number;
  innocentVotes: number;
  guiltyVotes: number;
  totalStaked: bigint;
  isActive: boolean;
  isFinalized: boolean;
  winner: string;
  plaintiffPersonaUrl: string;
  defendantPersonaUrl: string;
};

export async function getContract() {
  // Try Hardhat node first, fallback to injected provider
  try {
    /*
    const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545");
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, PeoplesCourtABI.abi, signer);
    */
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, PeoplesCourtABI.abi, signer);
  } catch (error) {
    if (!window.ethereum) throw new Error("No Web3 Provider");
  }
}

export async function getCases(): Promise<Case[]> {
  const contract = await getContract();

  const caseCount = await contract.currentCaseId();
  console.log("Got case count:", caseCount);

  const caseData = await contract.cases(1);
  console.log("Got first case:", caseData);

  const cases: Case[] = [];

  for (let i = 1; i <= caseCount; i++) {
    const caseData = await contract.cases(i);

    const [plaintiffPersonaUrl, defendantPersonaUrl] = await Promise.all([
      contract.personaUris(caseData.plaintiff),
      contract.personaUris(caseData.defendant),
    ]);

    cases.push({
      id: i,
      title: caseData.title,
      caseUri: caseData.caseUri,
      plaintiff: caseData.plaintiff,
      defendant: caseData.defendant,
      startTime: Number(caseData.startTime),
      endTime: Number(caseData.endTime),
      prizePool: caseData.prizePool,
      nftId: Number(caseData.nftId),
      innocentVotes: Number(caseData.innocentVotes),
      guiltyVotes: Number(caseData.guiltyVotes),
      totalStaked: caseData.totalStaked,
      isActive: caseData.isActive,
      isFinalized: caseData.isFinalized,
      winner: caseData.winner,
      plaintiffPersonaUrl,
      defendantPersonaUrl,
    });
  }

  return cases;
}

export async function vote(
  caseId: number,
  voteGuilty: boolean,
  amount: bigint
) {
  const contract = await getContract();
  return contract.vote(caseId, voteGuilty, { value: amount });
}

export async function contributeToPrizePool(caseId: number, amount: bigint) {
  const contract = await getContract();
  return contract.send({ value: amount });
}

