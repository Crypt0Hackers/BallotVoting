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
const ballotAddress = "0x2aFEa7723f3876fe0A1b5DC34244940FA2DE1Cc3";

export const ballotContract = provider
  ? new ethers.Contract(ballotAddress, Ballot, provider)
  : null;