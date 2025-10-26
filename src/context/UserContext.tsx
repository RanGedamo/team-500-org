// context/UserContext.tsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";



type UserContextType = {
  user: any; // Define a proper user type based on your user object structure
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return;
      const data = await res.json();
      
      setUser(data);
    } catch (e) {
      console.error("Error fetching user:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchUser();
}, []);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};