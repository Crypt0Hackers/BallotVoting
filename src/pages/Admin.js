import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSigner } from '@/context/SignerContext';
import { ballotContract, getSigner } from "../ethereum/utils/contract";
import Link from "next/link";

// Import your contract utils here

export default function Admin() {
    const router = useRouter();
    const [signer, setSigner] = useSigner();

    useEffect(() => {
        const loadSigner = async () => {
            const signer = await getSigner();
            setSigner(signer);
        };
        loadSigner();
    }, []);

    useEffect(() => {

        if (!signer || !ballotContract) {
            router.push("/home");
        }
        // console.log("Signer:", signer);
        // console.log("Ballot Contract:", ballotContract);
    }, [signer, ballotContract, router]);


    const [name, setName] = useState("");
    const [partyShortCut, setPartyShortCut] = useState("");
    const [partyFlag, setPartyFlag] = useState("");
    const [stateCode, setStateCode] = useState("");
    const [constituencyCode, setConstituencyCode] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const handleRegisterCandidate = async () => {
        const args = { name, partyShortCut, partyFlag, stateCode: parseInt(stateCode, 10), constituencyCode: parseInt(constituencyCode) };

        try {
            const tx = await ballotContract.connect(signer).registerCandidate(args);
            await tx.wait();
            alert("Candidate registered successfully!");
        } catch (error) {
            console.error("Error while registering candidate:", error);
        }
    };

    const handleUpdateStartTime = async () => {
        try {
            const tx = await ballotContract.connect(signer).updateStartTime(startTime);
            await tx.wait();
            alert("Start time updated successfully!");
        } catch (error) {
            console.error("Error while updating start time:", error);
        }
    };

    const handleUpdateEndTime = async () => {
        // Implement updateEndTime interaction here
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-semibold mb-6">Admin Panel</h1>
            <form>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Register Candidate</h2>
                    <input
                        type="text"
                        placeholder="Candidate Name"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Party ShortCut"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={partyShortCut}
                        onChange={(e) => setPartyShortCut(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Party Flag"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={partyFlag}
                        onChange={(e) => setPartyFlag(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="State Code"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Constituency Code"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={constituencyCode}
                        onChange={(e) => setConstituencyCode(e.target.value)}
                    />
                    <h2 className="text-xl font-semibold">Update Start Time</h2>
                    <input
                        type="text"
                        placeholder="Start Time"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                    <h2 className="text-xl font-semibold">Update End Time</h2>
                    <input
                        type="text"
                        placeholder="End Time"
                        className="w-full border border-gray-300 p-2 rounded text-black"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>
                <div className="space-x-2 mt-6">
                    <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleRegisterCandidate}
                    >
                        Register Candidate
                    </button>
                    <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleUpdateStartTime}
                    >
                        Update Start Time
                    </button>
                    <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleUpdateEndTime}
                    >
                        Update End Time
                    </button>
                    <Link href="/Home" className="bg-blue-500 text-white px-4 py-2 mt-6 rounded font-medium w-full inline-block text-center">
                        Return Home
                    </Link>
                </div>
            </form>
        </div>
    );
}
