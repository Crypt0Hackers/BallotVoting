import { createContext, useContext, useState } from "react";

const SignerContext = createContext();

export const useSigner = () => {
  const context = useContext(SignerContext);
  if (!context) {
    throw new Error("useSigner must be used within a SignerProvider");
  }
  return context;
};

export const SignerProvider = ({ children }) => {
  const [signer, setSigner] = useState(null);

  return (
    <SignerContext.Provider value={[signer, setSigner]}>
      {children}
    </SignerContext.Provider>
  );
};
