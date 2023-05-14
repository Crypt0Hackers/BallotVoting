import { ethers } from "ethers";
import Ballot from "../abi/Ballot.json";

const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    console.log("Please install MetaMask to use this dApp!");
    // window.alert("Please install MetaMask to use this dApp!");
  }
};

export const getSigner = () => {
  const provider = getProvider();
  return provider ? provider.getSigner() : null;
}

const provider = getProvider();
const ballotAddress = "0xD8BF394773D4DdA17274E59B01eb389a66019f8D";

export const ballotContract = provider
  ? new ethers.Contract(ballotAddress, Ballot, provider)
  : null;