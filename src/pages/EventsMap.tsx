import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackScreenProps } from "@react-navigation/stack";
import React, { useContext, useRef, useState, useEffect } from "react"; // Added useEffect
import { Image, StyleSheet, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import customMapStyle from "../../map-style.json";
import * as MapSettings from "../constants/MapSettings";
import { AuthenticationContext } from "../context/AuthenticationContext";
import mapMarkerImg from "../images/map-marker.png";
import { EventDetails } from "../@types/Events";
import * as api from "../services/api"; // Make sure this is imported
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import mapMarkerOrange from "../images/map-marker.png";
import mapMarkerBlue from "../images/map-marker-blue.png";
import mapMarkerGrey from "../images/map-marker-grey.png";
import { parseISO, isAfter } from "date-fns";

export default function EventsMap({ navigation }: StackScreenProps<any>) {
  const authenticationContext = useContext(AuthenticationContext);
  const mapViewRef = useRef<MapView>(null);
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await api.getEvents();
      const now = new Date();

      // Filter out past events
      const currentEvents = response.data.filter((event: EventDetails) => {
        const eventEndDate = parseISO(event.endDateTime || event.dateTime);
        return isAfter(eventEndDate, now);
      });

      console.log("Filtered events:", currentEvents);
      setEvents(currentEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Single useFocusEffect to handle all event loading
  useFocusEffect(
    React.useCallback(() => {
      console.log("Loading events due to focus");
      loadEvents();
    }, [])
  );

  const handleNavigateToCreateEvent = () => {
    navigation.navigate("CreateEvent");
  };

  const handleNavigateToEventDetails = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      navigation.navigate("EventDetails", { event });
    }
  };

  const getMarkerImage = (event: EventDetails) => {
    const currentVolunteers = event.volunteersIds?.length || 0;
    const spotsLeft = event.volunteersNeeded - currentVolunteers;

    if (spotsLeft <= 0) {
      return mapMarkerGrey; // Full events
    } else if (spotsLeft === 1) {
      return mapMarkerBlue; // Nearly full events
    }
    return mapMarkerOrange; // Open events with multiple spots
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["userInfo", "accessToken"]);
      if (authenticationContext) {
        authenticationContext.setValue(null); // Changed from undefined to null
      }
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        initialRegion={MapSettings.DEFAULT_REGION}
        style={styles.mapStyle}
        customMapStyle={customMapStyle}
        showsMyLocationButton={false}
        showsUserLocation={true}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        mapPadding={MapSettings.EDGE_PADDING}
        onLayout={() =>
          mapViewRef.current?.fitToCoordinates(
            events.map(({ position }) => ({
              latitude: position.latitude,
              longitude: position.longitude,
            })),
            { edgePadding: MapSettings.EDGE_PADDING }
          )
        }
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.position.latitude,
              longitude: event.position.longitude,
            }}
            onPress={() => handleNavigateToEventDetails(event.id)}
          >
            <Image
              resizeMode="contain"
              style={styles.markerImage}
              source={getMarkerImage(event)}
            />
          </Marker>
        ))}
      </MapView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{events.length} event(s) found</Text>
        <RectButton
          style={[styles.smallButton, { backgroundColor: "#00A3FF" }]}
          onPress={handleNavigateToCreateEvent}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </RectButton>
      </View>

      <RectButton
        style={[
          styles.logoutButton,
          styles.smallButton,
          { backgroundColor: "#4D6F80" },
        ]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color="#FFF" />
      </RectButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  mapStyle: {
    ...StyleSheet.absoluteFillObject,
  },

  logoutButton: {
    position: "absolute",
    top: 70,
    right: 24,

    elevation: 3,
  },

  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 40,

    backgroundColor: "#FFF",
    borderRadius: 16,
    height: 56,
    paddingLeft: 24,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    elevation: 3,
  },

  footerText: {
    fontFamily: "Nunito_700Bold",
    color: "#8fa7b3",
  },
  markerImage: {
    width: 48,
    height: 54,
  },

  smallButton: {
    width: 56,
    height: 56,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },
});

interface event {
  id: string;
  position: {
    latitude: number;
    longitude: number;
  };
}
