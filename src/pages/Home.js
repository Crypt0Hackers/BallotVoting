import { useState, useEffect } from "react";
import { ballotContract, getSigner } from "../ethereum/utils/contract";
import Link from 'next/link';
import { useSigner } from "@/context/SignerContext";
import { ethers } from "ethers";

export default function Home() {
  const [signer, setSigner] = useSigner();
  const [candidateNominationNo, setCandidateNominationNo] = useState("");
  const [isOwner, setIsOwner] = useState(false)
  const [candidateList, setCandidateList] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [saudiId, setSaudiId] = useState("");
  const [voterConstituencyCode, setVoterConstituencyCode] = useState("");
  const [voterStateCode, setVoterStateCode] = useState("");
  // const [voterSaudiId, setVoterSaudiId] = useState("");
  const [votingOpen, setVotingOpen] = useState(false);
  const [secondsToStartTime, setSecondsToStartTime] = useState(0);
  const [secondsToEnd, setSecondsToEnd] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOwner = async () => {
      try {
        const owner = await ballotContract.owner();
        // console.log("Owner:", owner);
        const signer = await getSigner();
        setSigner(signer);

        if (signer.address === owner) {
          setIsOwner(true);
        }

        const saudiId = await ballotContract.connect(signer).getVoterSaudiId()
        console.log("Saudi ID: ", saudiId);
        if (saudiId !== 0) {
          setRegistered(true);
          console.log(saudiId)
        }

        const timeTillVoteOpens = Number(await ballotContract.getSecondsToStartTime());
        // console.log("Time till vote opens:", timeTillVoteOpens);
        if (timeTillVoteOpens > 0) {
          setVotingOpen(false);
        } else {
          setVotingOpen(true);
        }

      } catch (error) {
        console.error("Error while loading initial state:", error);
      }
    }

    loadOwner();
  }, [])

  useEffect(() => {
    if (signer) {
      fetchCandidates();
      fetchVotingDetails();
    }
  }, [signer]);

  const connectMetaMask = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      let signer = await getSigner();

      // Check network and request to change it if it's not Sepolia
      const network = await signer.provider.getNetwork();
      const sepoliaChainId = 11155111; // Sepolia Testnet Chain ID
      if (network.chainId !== sepoliaChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${sepoliaChainId.toString(16)}` }],
          });
          // Re-fetch signer after switching the network
          signer = await getSigner();
        } catch (switchError) {
          console.error("Error switching to Sepolia:", switchError);
        }
      }

      let owner = await getOwner();

      if (signer.address === owner) {
        setIsOwner(true);
      }
      setSigner(signer);
      window.location.reload();
    } catch (error) {
      console.error("User rejected the request:", error);
    }
  };


  async function fetchVotingDetails() {
    try {
      const secondsToStart = await ballotContract.getSecondsToStartTime();
      const endTime = await ballotContract.getVotingEndTime();
      const current = await ballotContract.getCurrentTimestamp();

      console.log("endTime: ", Number(endTime), " current: ", Number(current))

      setSecondsToStartTime(Number(secondsToStart));
      const seconds = Number(endTime) - Number(current);
      setSecondsToEnd(seconds > 0 ? seconds : 0);
    } catch (error) {
      console.error("Error while fetching voting details:", error);
    }
  }


  const handleVote = async () => {
    if (!signer) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!ballotContract) {
      alert("Ethereum provider not available");
      return;
    }

    try {
      const tx = await ballotContract.connect(signer).vote(candidateNominationNo);
      await tx.wait();
      alert("Vote submitted successfully!");
    } catch (error) {
      setError("Error while submitting vote");
      console.error(error);
    }
  };

  const handleRegisterVoter = async () => {
    if (!signer) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!ballotContract) {
      alert("Ethereum provider not available");
      return;
    }

    const voterArgs = {
      _SaudiId: parseInt(saudiId, 10),
      _voterAddress: signer.address,
      constituencyCode: parseInt(voterConstituencyCode, 10),
      stateCode: parseInt(voterStateCode, 10),
    };

    try {
      const tx = await ballotContract.connect(signer).registerVoter(voterArgs);
      await tx.wait();
      alert("Voter registered successfully!");

      setRegistered(true);
    } catch (error) {
      console.error("Error while registering voter:", error);
    }
  };

  const getOwner = async () => {
    if (!ballotContract) {
      alert("Ethereum provider not available");
      return;
    }

    try {
      const owner = await ballotContract.owner();
      console.log("Owner:", owner);
      return owner;
    } catch (error) {
      console.error("Error while getting owner:", error);
    }
  };

  const fetchCandidates = async () => {
    if (!signer) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!ballotContract) {
      alert("Ethereum provider not available");
      return;
    }

    try {
      const voterSaudiId = await ballotContract.connect(signer).getVoterSaudiId();
      if (!voterSaudiId) {
        setRegistered(false);
      } else {
        // const candidates = await ballotContract.getCandidateList(voterSaudiId); // @amaechi - we need to change way the smart contract returns the array of candidates

        const candidateCount = await ballotContract.candidateCount();
        const candidates = [];

        for (let i = 1; i < parseInt(candidateCount) + 1; i++) {
          const candidateData = await ballotContract._candidate(i);
          const candidate = {
            voteCount: candidateData[0],
            nominationNo: candidateData[1],
            name: candidateData[2],
            partyShortcut: candidateData[3],
            partyFlag: candidateData[4],
            stateCode: candidateData[5],
            constituencyCode: candidateData[6],
          };
          candidates.push(candidate);
        }

        console.log("Candidates:", candidates)
        setCandidateList(candidates);
      }
    } catch (error) {
      console.error("Error while fetching candidates:", error);
    }
  };

  const renderCandidates = () => {
    return candidateList.map((candidate, index) => (
      <div key={index} className="p-4 border-b">
        <h3 className="font-bold">{candidate.name}</h3>
        <p>Nomination No: {Number(candidate.nominationNo)}</p>
        <p>Party: {candidate.partyShortcut}</p>
        <p>Party Flag: {candidate.partyFlag}</p>
        <p>State Code: {Number(candidate.stateCode)}</p>
        <p>Constituency Code: {Number(candidate.constituencyCode)}</p>
        <p>
          Vote Count:{" "}
          {secondsToEnd > 0 ? (
            <span className="text-red-500">voting still active</span>
          ) : (
            Number(candidate.voteCount) > 0 ? (
              Number(candidate.voteCount)
            ) : (
              0
            )
          )}
        </p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Ballot</h1>
        {signer && (
          <div className="bg-white text-black p-8 rounded-lg shadow-lg w-full max-w-3xl mt-10">
            <h2 className="text-xl font-bold mb-6 text-center">Candidates</h2>
            {renderCandidates()}
          </div>
        )}
        {signer && (
          <div className="bg-white p-4 text-black rounded-lg shadow-lg w-full max-w-md mt-4">
            <h2 className="text-xl font-bold mb-4 text-center">Voting Details</h2>
            <p>Seconds to start time: {secondsToStartTime}</p>
            <p>Seconds to end time: {secondsToEnd}</p>
          </div>
        )}
        <br />
        {!signer?.address && (
          <button
            onClick={connectMetaMask}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium w-full mb-4"
          >
            Connect to MetaMask
          </button>
        )}
        {!registered ? (
          <>
            <h2 className="text-xl font-bold mb-6 text-center">Register as a Voter</h2>
            <input
              type="number"
              placeholder="Saudi ID"
              value={saudiId}
              onChange={(e) => setSaudiId(e.target.value)}
              className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4"
            />
            <input
              type="number"
              placeholder="Constituency Code"
              value={voterConstituencyCode}
              onChange={(e) => setVoterConstituencyCode(e.target.value)}
              className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4"
            />
            <input
              type="number"
              placeholder="State Code"
              value={voterStateCode}
              onChange={(e) => setVoterStateCode(e.target.value)}
              className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4"
            />
            <button
              onClick={handleRegisterVoter}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium w-full"
            >
              Register
            </button>
          </>
        ) : null}
        {registered ?
          <div className="mb-4">
            <input
              type="number"
              placeholder="Candidate Nomination No"
              value={candidateNominationNo}
              onChange={(e) => setCandidateNominationNo(e.target.value)}
              className="bg-gray-100 border-2 w-full p-4 rounded-lg"
            />
          </div> : null}
        {registered && votingOpen ?
          <button
            onClick={handleVote}
            className="bg-green-600 text-white px-6 py-2 rounded font-medium w-full"
          >
            Vote
          </button> : null}
        {error && (
          <p className="text-red-500 text-s mt-5 text-center">
            {error}
          </p>
        )}
        {signer ?
          isOwner ? <Link href="/Admin" className="bg-blue-500 text-white px-4 py-2 mt-6 rounded font-medium w-full inline-block text-center">
            Go to Admin
          </Link> : null : null
        }
      </div>
    </div>
  );

}
