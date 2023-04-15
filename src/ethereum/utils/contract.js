import { ethers } from "ethers";
import Ballot from "../abi/Ballot.json";

const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    console.log("Please install MetaMask to use this dApp!");
  }
};

export const getSigner = () => {
  const provider = getProvider();
  return provider ? provider.getSigner() : null;
}

const provider = getProvider();
const ballotAddress = "0x6792eD70a2035b81edb12d3Fad91a9BF2886A3d7";

export const ballotContract = provider
  ? new ethers.Contract(ballotAddress, Ballot, provider)
  : null;