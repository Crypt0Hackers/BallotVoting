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
const ballotAddress = "0x9f58A1D06F9b730c86162DdEeBD42a720e17c41A";

export const ballotContract = provider
  ? new ethers.Contract(ballotAddress, Ballot, provider)
  : null;