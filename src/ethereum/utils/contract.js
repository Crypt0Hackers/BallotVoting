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
const ballotAddress = "0x8C1682B15C529E4d01b7e76a45d3c9F61971f122";

export const ballotContract = provider
  ? new ethers.Contract(ballotAddress, Ballot, provider)
  : null;