import React, { createContext, useState, useContext, useEffect } from "react";
import { clubAPI } from "../services/api";

const ClubContext = createContext(null);

export const ClubProvider = ({ children }) => {
  const [selectedClub, setSelectedClub] = useState(() => {
    const saved = localStorage.getItem("selectedClub");
    return saved ? JSON.parse(saved) : null;
  });
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedClub) {
      localStorage.setItem("selectedClub", JSON.stringify(selectedClub));
    } else {
      localStorage.removeItem("selectedClub");
    }
  }, [selectedClub]);

  const fetchMyClubs = async () => {
    setLoading(true);
    try {
      const response = await clubAPI.getMyClubs();
      setMyClubs(response.data);

      // If no club is selected but user has clubs, select the first one
      if (!selectedClub && response.data.length > 0) {
        setSelectedClub(response.data[0]);
      }
      // If selected club is no longer in the list, clear it
      if (
        selectedClub &&
        !response.data.find((c) => c.uid === selectedClub.uid)
      ) {
        setSelectedClub(response.data.length > 0 ? response.data[0] : null);
      }
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
      setMyClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const selectClub = (club) => {
    setSelectedClub(club);
  };

  const clearClub = () => {
    setSelectedClub(null);
  };

  return (
    <ClubContext.Provider
      value={{
        selectedClub,
        myClubs,
        loading,
        selectClub,
        clearClub,
        fetchMyClubs,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error("useClub must be used within ClubProvider");
  }
  return context;
};
