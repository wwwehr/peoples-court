const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeoplesCourtDAO", function () {
  let peoplesCourt;
  let owner;
  let judge;
  let plaintiff;
  let defendant;
  let voter1;
  let voter2;
  const MINIMUM_STAKE = ethers.parseEther("0.01");

  // Helper function to parse case data
  const parseCase = (caseData) => {
    const [
      title,
      caseUri,
      plaintiffAddr,
      defendantAddr,
      startTime,
      endTime,
      prizePool,
      nftId,
      innocentVotes,
      guiltyVotes,
      totalStaked,
      isActive,
      isFinalized,
      winner
    ] = caseData;

    return {
      title,
      caseUri,
      plaintiff: plaintiffAddr,
      defendant: defendantAddr,
      startTime,
      endTime,
      prizePool,
      nftId,
      innocentVotes,
      guiltyVotes,
      totalStaked,
      isActive,
      isFinalized,
      winner
    };
  };

  beforeEach(async function () {
    [owner, judge, plaintiff, defendant, voter1, voter2] = await ethers.getSigners();
    
    const PeoplesCourtDAO = await ethers.getContractFactory("PeoplesCourtDAO");
    peoplesCourt = await PeoplesCourtDAO.deploy(owner.address);
    await peoplesCourt.waitForDeployment();
    await peoplesCourt.setJudge(judge.address);

    // Fund the treasury
    await owner.sendTransaction({
      to: peoplesCourt.target,
      value: ethers.parseEther("10.0")
    });
  });

  describe("Initialization", function () {
    it("Should set the correct owner and judge", async function () {
      expect(await peoplesCourt.owner()).to.equal(owner.address);
      expect(await peoplesCourt.judge()).to.equal(judge.address);
      expect(await ethers.provider.getCode(peoplesCourt.target)).to.not.equal('0x');
    });

    it("Should have the correct minimum stake", async function () {
      expect(await peoplesCourt.MINIMUM_STAKE()).to.equal(MINIMUM_STAKE);
    });
  });

  describe("Persona Creation", function () {
    it("Should allow users to create personas", async function () {
      const personaUri = "ipfs://QmPersonaHash";
      await expect(peoplesCourt.connect(plaintiff).createPersona(personaUri))
        .to.emit(peoplesCourt, "PersonaCreated")
        .withArgs(plaintiff.address, personaUri);

      expect(await peoplesCourt.personaUris(plaintiff.address)).to.equal(personaUri);
    });
  });

  describe("Case Management", function () {
    const caseTitle = "Test Case";
    const caseUri = "ipfs://QmCaseHash";
    const duration = 86400; // 1 day
    const prizeAmount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await peoplesCourt.connect(plaintiff).createPersona("ipfs://QmPlaintiffHash");
      await peoplesCourt.connect(defendant).createPersona("ipfs://QmDefendantHash");
    });

    it("Should create a new case", async function () {
      await expect(
        peoplesCourt.connect(owner).createCase(
          caseTitle,
          caseUri,
          plaintiff.address,
          defendant.address,
          duration,
          prizeAmount
        )
      ).to.emit(peoplesCourt, "CaseCreated")
        .withArgs(1, caseTitle, plaintiff.address, defendant.address, prizeAmount, 1);

      const caseData = await peoplesCourt.cases(1);
      const parsedCase = parseCase(caseData);
      
      expect(parsedCase.title).to.equal(caseTitle);
      expect(parsedCase.plaintiff).to.equal(plaintiff.address);
      expect(parsedCase.defendant).to.equal(defendant.address);
      expect(parsedCase.prizePool).to.equal(prizeAmount);
      expect(parsedCase.isActive).to.be.true;
    });

    it("Should not create case without personas", async function () {
      const randomUser = ethers.Wallet.createRandom().address;
      await expect(
        peoplesCourt.connect(owner).createCase(
          caseTitle,
          caseUri,
          randomUser,
          defendant.address,
          duration,
          prizeAmount
        )
      ).to.be.revertedWith("Plaintiff needs persona");
    });
  });

  describe("Evidence and Arguments", function () {
    const caseId = 1;
    
    beforeEach(async function () {
      await peoplesCourt.connect(plaintiff).createPersona("ipfs://QmPlaintiffHash");
      await peoplesCourt.connect(defendant).createPersona("ipfs://QmDefendantHash");
      
      await peoplesCourt.connect(owner).createCase(
        "Test Case",
        "ipfs://QmCaseHash",
        plaintiff.address,
        defendant.address,
        86400,
        ethers.parseEther("1.0")
      );
    });

    it("Should allow evidence submission by plaintiff and defendant", async function () {
      const evidenceUri = "ipfs://QmEvidenceHash";
      
      await expect(
        peoplesCourt.connect(plaintiff).submitEvidence(caseId, "Evidence 1", evidenceUri)
      ).to.emit(peoplesCourt, "EvidenceSubmitted")
        .withArgs(caseId, 0, plaintiff.address, evidenceUri);

      await expect(
        peoplesCourt.connect(defendant).submitEvidence(caseId, "Evidence 2", evidenceUri)
      ).to.emit(peoplesCourt, "EvidenceSubmitted")
        .withArgs(caseId, 1, defendant.address, evidenceUri);
    });

    it("Should not allow evidence submission by non-parties", async function () {
      await expect(
        peoplesCourt.connect(voter1).submitEvidence(caseId, "Evidence", "ipfs://QmEvidenceHash")
      ).to.be.revertedWith("Only plaintiff or defendant can submit evidence");
    });

    it("Should allow argument submission by plaintiff and defendant", async function () {
      const argumentUri = "ipfs://QmArgumentHash";
      
      await expect(
        peoplesCourt.connect(plaintiff).submitArgument(caseId, argumentUri)
      ).to.emit(peoplesCourt, "ArgumentSubmitted")
        .withArgs(caseId, 0, plaintiff.address, argumentUri);

      await expect(
        peoplesCourt.connect(defendant).submitArgument(caseId, argumentUri)
      ).to.emit(peoplesCourt, "ArgumentSubmitted")
        .withArgs(caseId, 1, defendant.address, argumentUri);
    });

    it("Should not allow argument submission by non-parties", async function () {
      await expect(
        peoplesCourt.connect(voter1).submitArgument(caseId, "ipfs://QmArgumentHash")
      ).to.be.revertedWith("Only plaintiff or defendant can submit arguments");
    });
  });

  describe("Voting", function () {
    const caseId = 1;
    
    beforeEach(async function () {
      await peoplesCourt.connect(plaintiff).createPersona("ipfs://QmPlaintiffHash");
      await peoplesCourt.connect(defendant).createPersona("ipfs://QmDefendantHash");
      
      await peoplesCourt.connect(owner).createCase(
        "Test Case",
        "ipfs://QmCaseHash",
        plaintiff.address,
        defendant.address,
        86400,
        ethers.parseEther("1.0")
      );
    });

    it("Should allow voting with minimum stake", async function () {
      await expect(
        peoplesCourt.connect(voter1).vote(caseId, true, { value: MINIMUM_STAKE })
      ).to.emit(peoplesCourt, "VoteCast")
        .withArgs(caseId, voter1.address, true, MINIMUM_STAKE);

      const caseData = await peoplesCourt.cases(caseId);
      const parsedCase = parseCase(caseData);
      
      expect(parsedCase.guiltyVotes).to.equal(1);
      expect(parsedCase.totalStaked).to.equal(MINIMUM_STAKE);
    });

    it("Should not allow voting below minimum stake", async function () {
      await expect(
        peoplesCourt.connect(voter1).vote(caseId, true, { value: MINIMUM_STAKE - 1n })
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should not allow double voting", async function () {
      await peoplesCourt.connect(voter1).vote(caseId, true, { value: MINIMUM_STAKE });
      await expect(
        peoplesCourt.connect(voter1).vote(caseId, false, { value: MINIMUM_STAKE })
      ).to.be.revertedWith("Already voted");
    });

    it("Should not allow voting after voting period", async function () {
      // Increase time beyond the voting period
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
      await ethers.provider.send("evm_mine");

      await expect(
        peoplesCourt.connect(voter1).vote(caseId, true, { value: MINIMUM_STAKE })
      ).to.be.revertedWith("Voting period ended");
    });
  });

  describe("Case Finalization", function () {
    const caseId = 1;
    
    beforeEach(async function () {
      await peoplesCourt.connect(plaintiff).createPersona("ipfs://QmPlaintiffHash");
      await peoplesCourt.connect(defendant).createPersona("ipfs://QmDefendantHash");
      
      await peoplesCourt.connect(owner).createCase(
        "Test Case",
        "ipfs://QmCaseHash",
        plaintiff.address,
        defendant.address,
        86400,
        ethers.parseEther("1.0")
      );

      // Add some votes
      await peoplesCourt.connect(voter1).vote(caseId, true, { value: MINIMUM_STAKE });
      await peoplesCourt.connect(voter2).vote(caseId, false, { value: MINIMUM_STAKE });
    });

    it("Should allow judge to finalize case", async function () {
      await expect(
        peoplesCourt.connect(judge).finalizeCase(caseId, plaintiff.address)
      ).to.emit(peoplesCourt, "CaseFinalized");

      const caseData = await peoplesCourt.cases(caseId);
      const parsedCase = parseCase(caseData);
      
      expect(parsedCase.isFinalized).to.be.true;
      expect(parsedCase.isActive).to.be.false;
      expect(parsedCase.winner).to.equal(plaintiff.address);
    });

    it("Should not allow non-judge to finalize case", async function () {
      await expect(
        peoplesCourt.connect(owner).finalizeCase(caseId, plaintiff.address)
      ).to.be.revertedWith("Only judge can finalize case");
    });

    it("Should allow voters to reclaim stakes after finalization", async function () {
      await peoplesCourt.connect(judge).finalizeCase(caseId, plaintiff.address);
      
      const beforeBalance = await ethers.provider.getBalance(voter1.address);
      const tx = await peoplesCourt.connect(voter1).reclaimStake(caseId);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;
      const afterBalance = await ethers.provider.getBalance(voter1.address);
      
      expect(afterBalance + gasSpent - beforeBalance).to.equal(MINIMUM_STAKE);
    });

    it("Should not allow reclaiming stake twice", async function () {
      await peoplesCourt.connect(judge).finalizeCase(caseId, plaintiff.address);
      await peoplesCourt.connect(voter1).reclaimStake(caseId);
      
      await expect(
        peoplesCourt.connect(voter1).reclaimStake(caseId)
      ).to.be.revertedWith("Stake already reclaimed");
    });

    it("Should not allow reclaiming stake before finalization", async function () {
      await expect(
        peoplesCourt.connect(voter1).reclaimStake(caseId)
      ).to.be.revertedWith("Case not finalized");
    });

    it("Should transfer NFT to winner", async function () {
      await peoplesCourt.connect(judge).finalizeCase(caseId, plaintiff.address);
      expect(await peoplesCourt.ownerOf(1)).to.equal(plaintiff.address);
    });
  });

  describe("Treasury Management", function () {
    it("Should accept direct payments", async function () {
      const amount = ethers.parseEther("1.0");
      const beforeBalance = await peoplesCourt.treasuryBalance();
      
      await owner.sendTransaction({
        to: peoplesCourt.target,
        value: amount
      });
      
      const afterBalance = await peoplesCourt.treasuryBalance();
      expect(afterBalance - beforeBalance).to.equal(amount);
    });

    it("Should not create case with insufficient treasury funds", async function () {
      await peoplesCourt.connect(plaintiff).createPersona("ipfs://QmPlaintiffHash");
      await peoplesCourt.connect(defendant).createPersona("ipfs://QmDefendantHash");
      
      const hugeAmount = ethers.parseEther("100.0"); // More than treasury balance
      
      await expect(
        peoplesCourt.connect(owner).createCase(
          "Test Case",
          "ipfs://QmCaseHash",
          plaintiff.address,
          defendant.address,
          86400,
          hugeAmount
        )
      ).to.be.revertedWith("Insufficient treasury funds");
    });
  });
});