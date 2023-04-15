// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
    const [dataURL, setDataURL] = useState("");
    const [token, setToken] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const router = useRouter();

    const register = async () => {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        const data = await res.json();
        setDataURL(data.dataURL);
        setError("Check your email for the 6-digit code");
      };

      const verifyToken = async () => {
        const res = await fetch("/api/auth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
    
        const data = await res.json();
    
        if (res.status === 200) {
          router.push("/Home");
        } else {
          setMessage("");
          setError(data.message);
        }
      };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4"
                />
                <button
                    onClick={register}
                    className="bg-green-600 text-white px-6 py-2 rounded font-medium w-full mb-4"
                >
                    Register
                </button>
                <h2 className="text-xl font-bold mb-4 text-center">Enter the 6-digit code</h2>
                <input
                    type="text"
                    maxLength="6"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="bg-gray-100 border-2 w-full p-4 rounded-lg mb-4 text-center"
                />

                <button
                    onClick={verifyToken}
                    className="bg-blue-600 text-white px-6 py-2 rounded font-medium w-full mb-4"
                >
                    Verify
                </button>

                {error && (
                    <p className="text-red-500 text-xs text-center">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );

}
