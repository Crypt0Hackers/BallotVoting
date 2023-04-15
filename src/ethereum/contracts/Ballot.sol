// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Ballot is Ownable{

    error InvalidCaller();
    error AlreadyVoted();
    error VotingClosed();
    error VoterNotAlive();
    error AddressAlreadyRegistered();
    error VotingActive();

    // Total number of candidates that are registered
    uint public candidateCount;

    // Total number of votes
    uint public totalVoteCount;

    // Timestamp for when voting starts
    uint160 votingStartTime; 

    // Timestamps for when voting ends
    uint160 votingEndTime;

    // Details for each Candidate
    struct Candidate {
        uint voteCount; 
        uint nominationNo; 
        bytes32 name; 
        bytes32 partyShortcut;
        bytes32 partyFlag;
        uint32 stateCode;
        uint32 constituencyCode;
    }

    // Details for each Voter
    struct VoterDetails {
        uint votedTo; 
        uint32 constituencyCode; 
        uint32 stateCode; 
        bool isAlive; 
        bool voted;
        address[] registeredAccs; 
    }

    // Tracks each voter Saudi ID to their VoterDetails Struct
    mapping(uint SaudiId => VoterDetails) _voter; 

    // Tracks each candidate number to their Candidate struct
    mapping(uint nominationNo => Candidate) public _candidate;

    // Tracks each ethereum address to corresponding Saudi ID
    mapping(address => uint SaudiId) _voterSaudiId;

    /**
    * @dev event called when user submits a vote
    * @param voter - ID of person voting
    * @param totalVotes - Current vote count
    */
    event NewVote(uint indexed voter, uint indexed totalVotes);

    /**
    * @dev event called when a candidate is registered
    * @param candidate - details of the candidate
    * @param candidateId - ID of the candidate who has just been registered
    * @param candidateName - name of the candidate who has just been registered
    */
    event CandidateRegistered(Candidate indexed candidate, uint indexed candidateId, string indexed candidateName);

    /**
    * @dev event called when owner changes the start time
    * @param newStartTime - updated new start time
    */
    event StartTimeUpdated(uint160 indexed newStartTime);

    /**
    * @dev event called when owner changes the end time
    * @param newEndTime - updated new end time
    */
    event EndTimeUpdated(uint160 indexed newEndTime);

    /**
    * @dev timestamp can be truncated to uint160 instead of uint256
    * @param _votingStartTime epoch timestamp when the voting will start from current time
    * @param _votingEndTime epoch timestamp when the voting will end from current time
    * @param _owner consider using a multi-sig wallet as owner to minimize centralization risks
    */
    constructor(
        uint160 _votingStartTime,
        uint160 _votingEndTime,
        address _owner
    ){
        if(_votingStartTime>_votingEndTime) revert("STTS");
        if(uint160(_owner) == 0 || _owner == address(0)) revert("IO");

        votingStartTime = uint160(block.timestamp) + _votingStartTime;
        votingEndTime = uint160(block.timestamp) + _votingEndTime;

        if(votingStartTime<block.timestamp) revert("STSBT");
        if(votingEndTime<=block.timestamp) revert("ETSBT");

        if(_owner != msg.sender) transferOwnership(_owner);
    }   

    /**
    * @dev User submits vote for candidate
    * @notice Voters must submit their votes using an Ethereum address they have officially registered
    * @param candidateNominationNo ID number for Candidate
    */
    function vote(
        uint candidateNominationNo
    ) external {
        // Cache current timestamp
        uint160 currentTime = uint160(block.timestamp);

        // Revert if voting is not active
        if(currentTime < votingStartTime || currentTime >= votingEndTime) revert VotingClosed();

        // Cache Variables
        address voter = msg.sender;
        uint _SaudiId = _voterSaudiId[voter];
        VoterDetails memory voterCache = _voter[_SaudiId];
        Candidate memory candidateCache = _candidate[candidateNominationNo];

        // Revert if voter is ineligible to vote for this candidate
        if (candidateCache.stateCode != voterCache.stateCode 
            || candidateCache.constituencyCode != voterCache.constituencyCode
        ) revert InvalidCaller();

        // Revert if voter has already vote
        if (voterCache.voted) revert AlreadyVoted();

        // Revert if voter is not alive
        if (!voterCache.isAlive) revert VoterNotAlive();

        // Validate the msg.sender is registered under _SaudiId to prevent fraudulent votes
        uint32 voterAddressesCount = uint32(voterCache.registeredAccs.length);
        uint32 i;
        bool isValid;
        for(i; i < voterAddressesCount;){
            if(voter == voterCache.registeredAccs[i]) {
                isValid = true;
                break;
            }
            unchecked{++i;}
        }
        if(!isValid) revert InvalidCaller();

        // Update vote status
        _voter[_SaudiId].voted = true;
        _voter[_SaudiId].votedTo = candidateNominationNo;

        // Update vote counts
        ++_candidate[candidateNominationNo].voteCount;
        ++totalVoteCount;

        emit NewVote(_SaudiId, totalVoteCount);
    }

    /**
    * @dev Only owner can register a new Candidate
    * @param CandidateArgs struct containing params for new Candidate
    */
    struct CandidateArgs {
        string name;
        string partyShortCut;
        string partyFlag;
        uint32 stateCode;
        uint32 constituencyCode;
    }
    function registerCandidate(
        CandidateArgs memory args
    ) external onlyOwner{

        Candidate memory newCandidate = Candidate({
            voteCount: 0,
            nominationNo: candidateCount+1,
            name: bytes32(abi.encode(args.name)),
            partyShortcut: bytes32(abi.encodePacked(args.partyShortCut)),
            partyFlag: bytes32(abi.encode(args.partyFlag)),
            stateCode: args.stateCode,
            constituencyCode: args.constituencyCode
        });

        _candidate[newCandidate.nominationNo] = newCandidate;
        ++candidateCount;

        emit CandidateRegistered(newCandidate, newCandidate.nominationNo, args.name);
    }

    /**
    * @dev Owner must approve voter Ethereum address before they can vote
    * @notice Voters are allowed to have multiple addresses registered to their SaudiID
    * to prevent fradulent votes & allow support if user loses access to ethereum wallet
    * @param _SaudiId of the voter
    * @param _voterAddress Ethereum address they wish to register to vote with
    */
    struct VoterArgs{
        uint _SaudiId;
        address _voterAddress;
        uint32 constituencyCode; 
        uint32 stateCode;
    }
    function registerVoter(
        VoterArgs memory args
    ) external onlyOwner{
        if (_voterSaudiId[args._voterAddress] != 0) revert AddressAlreadyRegistered();

        VoterDetails memory newVoter = VoterDetails({
            votedTo: 0,
            constituencyCode: args.constituencyCode,
            stateCode: args.stateCode,
            isAlive: true,
            voted: false,
            registeredAccs: new address[](0)
        });

        _voter[args._SaudiId] = newVoter;
        _voter[args._SaudiId].registeredAccs.push(args._voterAddress);
        _voterSaudiId[args._voterAddress] = args._SaudiId;
    }

    /* View Functions */

    function getCandidateList(uint256 voterSaudiId)
        external
        view
        returns (Candidate[] memory cc)
    {
        VoterDetails memory voter_ = _voter[voterSaudiId];

        uint candidateCount_ = candidateCount;
        uint32 i;
        for ( i; i < candidateCount_;) { // Unbounded loop here is safe as candidateCount won't be excessively large
            if (
                voter_.stateCode == _candidate[i].stateCode &&
                voter_.constituencyCode == _candidate[i].constituencyCode
            ) {
                cc[i] = _candidate[i];
            }

            unchecked {
                ++i;
            }
        }
    }

    // Returns Time Until Voting Opens, if open returns 0
    function getSecondsToStartTime() external view returns (uint160){
        if(block.timestamp > votingStartTime) return 0;
        return (votingStartTime - uint160(block.timestamp));
    }

    // Return Start Time
    function getVotingStartTime() external view returns (uint160) {
        return votingStartTime;
    }

    // Return End Time
    function getVotingEndTime() external view returns (uint160) {
        return votingEndTime;
    }

    // Return Current Time for Front-End
    function getCurrentTimestamp() external view returns (uint CurrentTimestamp) {
        return block.timestamp;
    }

    /* Owner Functions */

    // Update start time
    function updateStartTime(uint160 _startTime) external onlyOwner {
        if (_startTime <= block.timestamp) revert();
        if (_startTime >= votingEndTime) revert();
        votingStartTime = _startTime;

        emit StartTimeUpdated(_startTime);
    }

    // Update end time
    function updateEndTime(uint160 _endTime) external onlyOwner {
        if (_endTime < votingStartTime) revert();
        if (_endTime <= block.timestamp) revert();
        votingEndTime = _endTime;

        emit EndTimeUpdated(_endTime);
    }

    // Return list of candidate results when voting is over
    function getCandidateResults() external view returns (Candidate[] memory results) {
        if (block.timestamp < votingEndTime) revert VotingActive();
        
        //Cache
        uint _candidateCount = candidateCount;
        uint32 i;

        for( i; i < _candidateCount;) {
            results[i] = _candidate[i];
            unchecked{ ++i;}
        }
    }
}