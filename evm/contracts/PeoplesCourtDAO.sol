// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PeoplesCourtDAO is ERC721, IERC721Receiver, Ownable, ReentrancyGuard {
    struct Evidence {
        address submitter;
        string title;
        string evidenceUri;    // IPFS URI containing evidence details
        uint256 timestamp;
        bool isAdmitted;
    }

    struct Argument {
        address submitter;
        string argumentUri;    // IPFS URI containing argument details
        uint256 timestamp;
    }

    struct Case {
        string title;
        string caseUri;        // Case description and details
        address plaintiff;
        address defendant;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 nftId;        // Unique NFT for this case
        uint256 innocentVotes;
        uint256 guiltyVotes;
        uint256 totalStaked;
        bool isActive;
        bool isFinalized;
        address winner;
        mapping(uint256 => Evidence) evidence;
        uint256 evidenceCount;
        mapping(uint256 => Argument) arguments;
        uint256 argumentCount;
        mapping(address => VoterInfo) voters;
    }

    struct VoterInfo {
        bool hasVoted;
        bool votedGuilty;
        uint256 stakedAmount;
    }

    uint256 public constant MINIMUM_STAKE = 0.01 ether;
    uint256 public currentCaseId;
    uint256 public treasuryBalance;
    address public judge;
    
    mapping(uint256 => Case) public cases;
    mapping(address => string) public personaUris;  // User address => IPFS URI with all persona details

    event PersonaCreated(address indexed user, string personaUri);
    
    event CaseCreated(
        uint256 indexed caseId, 
        string title,
        address plaintiff,
        address defendant,
        uint256 prizePool,
        uint256 nftId
    );

    event EvidenceSubmitted(
        uint256 indexed caseId,
        uint256 evidenceId,
        address submitter,
        string evidenceUri
    );

    event ArgumentSubmitted(
        uint256 indexed caseId,
        uint256 argumentId,
        address submitter,
        string argumentUri
    );

    event VoteCast(
        uint256 indexed caseId,
        address indexed voter,
        bool votedGuilty,
        uint256 stakedAmount
    );

    event CaseFinalized(
        uint256 indexed caseId,
        bool guiltyVerdict,
        address winner,
        uint256 prizeAmount,
        uint256 nftId
    );

    constructor(address initialOwner) Ownable(initialOwner) ERC721("Peoples Court Verdict", "VERDICT") {
        judge = msg.sender;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function setJudge(address newJudge) external onlyOwner {
        judge = newJudge;
    }

    function createPersona(string memory personaUri) external {
        personaUris[msg.sender] = personaUri;
        emit PersonaCreated(msg.sender, personaUri);
    }

    function createCase(
        string memory title,
        string memory caseUri,
        address plaintiff,
        address defendant,
        uint256 duration,
        uint256 prizeAmount
    ) external onlyOwner {
        require(treasuryBalance >= prizeAmount, "Insufficient treasury funds");
        require(bytes(personaUris[plaintiff]).length > 0, "Plaintiff needs persona");
        require(bytes(personaUris[defendant]).length > 0, "Defendant needs persona");
        
        currentCaseId++;
        uint256 nftId = currentCaseId;
        
        Case storage newCase = cases[currentCaseId];
        newCase.title = title;
        newCase.caseUri = caseUri;
        newCase.plaintiff = plaintiff;
        newCase.defendant = defendant;
        newCase.startTime = block.timestamp;
        newCase.endTime = block.timestamp + duration;
        newCase.prizePool = prizeAmount;
        newCase.nftId = nftId;
        newCase.isActive = true;
        
        treasuryBalance -= prizeAmount;
        _safeMint(address(this), nftId);
        
        emit CaseCreated(
            currentCaseId,
            title,
            plaintiff,
            defendant,
            prizeAmount,
            nftId
        );
    }

    function submitEvidence(
        uint256 caseId,
        string memory title,
        string memory evidenceUri
    ) external {
        Case storage currentCase = cases[caseId];
        require(currentCase.isActive, "Case is not active");
        require(
            msg.sender == currentCase.plaintiff || 
            msg.sender == currentCase.defendant,
            "Only plaintiff or defendant can submit evidence"
        );

        uint256 evidenceId = currentCase.evidenceCount++;
        Evidence storage newEvidence = currentCase.evidence[evidenceId];
        newEvidence.submitter = msg.sender;
        newEvidence.title = title;
        newEvidence.evidenceUri = evidenceUri;
        newEvidence.timestamp = block.timestamp;
        
        emit EvidenceSubmitted(
            caseId,
            evidenceId,
            msg.sender,
            evidenceUri
        );
    }

    function submitArgument(
        uint256 caseId,
        string memory argumentUri
    ) external {
        Case storage currentCase = cases[caseId];
        require(currentCase.isActive, "Case is not active");
        require(
            msg.sender == currentCase.plaintiff || 
            msg.sender == currentCase.defendant,
            "Only plaintiff or defendant can submit arguments"
        );

        uint256 argumentId = currentCase.argumentCount++;
        Argument storage newArgument = currentCase.arguments[argumentId];
        newArgument.submitter = msg.sender;
        newArgument.argumentUri = argumentUri;
        newArgument.timestamp = block.timestamp;

        emit ArgumentSubmitted(
            caseId,
            argumentId,
            msg.sender,
            argumentUri
        );
    }

    function vote(uint256 caseId, bool voteGuilty) external payable nonReentrant {
        Case storage currentCase = cases[caseId];
        require(currentCase.isActive, "Case is not active");
        require(block.timestamp <= currentCase.endTime, "Voting period ended");
        require(!currentCase.voters[msg.sender].hasVoted, "Already voted");
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake");

        currentCase.voters[msg.sender] = VoterInfo({
            hasVoted: true,
            votedGuilty: voteGuilty,
            stakedAmount: msg.value
        });

        if (voteGuilty) {
            currentCase.guiltyVotes++;
        } else {
            currentCase.innocentVotes++;
        }

        currentCase.totalStaked += msg.value;

        emit VoteCast(caseId, msg.sender, voteGuilty, msg.value);
    }

    function finalizeCase(uint256 caseId, address winner) external nonReentrant {
        require(msg.sender == judge, "Only judge can finalize case");
        
        Case storage currentCase = cases[caseId];
        require(currentCase.isActive, "Case not active");
        require(!currentCase.isFinalized, "Case already finalized");
        require(
            winner == currentCase.plaintiff || 
            winner == currentCase.defendant,
            "Winner must be plaintiff or defendant"
        );

        bool guiltyVerdict = currentCase.guiltyVotes > currentCase.innocentVotes;
        
        currentCase.winner = winner;
        currentCase.isActive = false;
        currentCase.isFinalized = true;

        // Transfer prize and NFT to winner
        (bool sent, ) = winner.call{value: currentCase.prizePool}("");
        require(sent, "Failed to send prize");
        
        _transfer(address(this), winner, currentCase.nftId);

        emit CaseFinalized(
            caseId,
            guiltyVerdict,
            winner,
            currentCase.prizePool,
            currentCase.nftId
        );
    }

    function reclaimStake(uint256 caseId) external nonReentrant {
        Case storage currentCase = cases[caseId];
        require(currentCase.isFinalized, "Case not finalized");
        
        VoterInfo memory voterInfo = currentCase.voters[msg.sender];
        require(voterInfo.hasVoted, "No stake to reclaim");
        require(voterInfo.stakedAmount > 0, "Stake already reclaimed");

        uint256 stakeAmount = voterInfo.stakedAmount;
        currentCase.voters[msg.sender].stakedAmount = 0;
        
        (bool sent, ) = msg.sender.call{value: stakeAmount}("");
        require(sent, "Failed to return stake");
    }

    receive() external payable {
        treasuryBalance += msg.value;
    }
}