import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/User";

export type AuthenticationContextObject = {
  value: User | null;
  setValue: (newValue: User | null) => void;
};

export const AuthenticationContext = createContext<AuthenticationContextObject>(
  {
    value: null,
    setValue: () => {},
  }
);

export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [value, setValue] = useState<User | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        console.log("Stored user info:", storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Setting auth context with:", parsedUser);
          setValue(parsedUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };
    initAuth();
  }, []);

  const handleSetValue = async (newValue: User | null) => {
    console.log("Setting new auth value:", newValue);
    try {
      if (newValue) {
        await AsyncStorage.setItem("userInfo", JSON.stringify(newValue));
      } else {
        await AsyncStorage.removeItem("userInfo");
      }
      setValue(newValue);
    } catch (error) {
      console.error("Error updating auth:", error);
    }
  };

  return (
    <AuthenticationContext.Provider value={{ value, setValue: handleSetValue }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
