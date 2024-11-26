import React, { useEffect } from "react";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import AppStack from "./src/routes/AppStack";
import { StatusBar } from "expo-status-bar";
import { AuthenticationProvider } from "./src/context/AuthenticationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = await AsyncStorage.getItem("userInfo");
      console.log("Stored user in App:", storedUser);
    };
    checkAuth();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar animated translucent style="dark" />
      <AuthenticationProvider>
        <ActionSheetProvider>
          <AppStack />
        </ActionSheetProvider>
      </AuthenticationProvider>
    </>
  );
}
