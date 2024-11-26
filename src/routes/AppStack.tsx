import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../pages/Login";
import EventsMap from "../pages/EventsMap";
import EventDetails from "../pages/EventDetails";
import CreateEvent from "../pages/CreateEvent";
import { EventDetails as EventDetailsType } from "../@types/Events";

// Define the type for the stack parameter list
type RootStackParamList = {
  Login: undefined;
  EventsMap: undefined;
  EventDetails: { event: EventDetailsType };
  CreateEvent: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "#F2F3F5" },
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="EventsMap" component={EventsMap} />
        <Stack.Screen name="EventDetails" component={EventDetails} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
