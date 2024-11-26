import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { format } from "date-fns";
import { AuthenticationContext } from "../context/AuthenticationContext";
import * as api from "../services/api";
import { StackScreenProps } from "@react-navigation/stack";
import { User } from "../types/User";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";

type RootStackParamList = {
  EventsMap: undefined;
  EventDetails: { event: EventDetailsType };
  CreateEvent: undefined;
};

// Define the route params type
type EventDetailsType = {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  endDateTime?: string;
  imageUrl?: string | null; // Add this
  volunteersNeeded: number;
  volunteersIds: string[];
};

// Define the navigation prop type
type Props = StackScreenProps<RootStackParamList, "EventDetails">;

const EventDetails = ({ route, navigation }: Props) => {
  const { event } = route.params;
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [isVolunteered, setIsVolunteered] = useState(false);
  const [showVolunteers, setShowVolunteers] = useState(false);
  const authContext = useContext(AuthenticationContext);
  const currentUserId = authContext?.value?.id;
  const isEventFull = volunteers.length >= event.volunteersNeeded;
  const isFocused = useIsFocused();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        console.log("Current stored user:", storedUser);
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    console.log("Auth context updated:", {
      user: authContext?.value,
      currentUserId,
      isAuthenticated: !!authContext?.value,
    });
  }, [authContext?.value]);

  useEffect(() => {
    console.log("Auth Context:", {
      currentUserId,
      authContext: authContext?.value,
      isAuthenticated: !!authContext?.value,
    });
  }, [authContext, currentUserId]);

  useEffect(() => {
    const initialize = async () => {
      await loadVolunteers();
      checkIfVolunteered();
    };

    if (isFocused) {
      initialize();
    }
  }, [isFocused, event.id]); // Add event.id as dependency

  // Add a separate useEffect for checking volunteer status when volunteers list changes
  useEffect(() => {
    checkIfVolunteered();
  }, [currentUserId, event.volunteersIds]);

  // Update checkIfVolunteered to be more stable
  const checkIfVolunteered = React.useCallback(() => {
    if (!currentUserId || !event.volunteersIds) {
      return;
    }
    const isUserVolunteered = event.volunteersIds.includes(currentUserId);
    setIsVolunteered(isUserVolunteered);
  }, [currentUserId, event.volunteersIds]);

  const loadVolunteers = async () => {
    try {
      if (!event.volunteersIds) return;

      const volunteerPromises = event.volunteersIds.map((id: string) =>
        api.getUser(id)
      );
      const volunteerResponses = await Promise.all(volunteerPromises);
      const volunteerDetails = volunteerResponses
        .filter((response) => response?.data)
        .map((response) => response.data);
      setVolunteers(volunteerDetails);
    } catch (err) {
      const error = err as Error;
      console.error("Error loading volunteers:", error.message);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const endTime = new Date(date.getTime() + 4 * 60 * 60 * 1000);
    return `${format(date, "MMM d, yyyy")}
${format(date, "h:mm a")} - ${format(endTime, "h:mm a")}`;
  };

  const handleVolunteerToggle = useCallback(async () => {
    if (!currentUserId) {
      Alert.alert("Error", "Please log in to volunteer");
      return;
    }

    const updatedVolunteerState = !isVolunteered;

    try {
      setIsVolunteered(updatedVolunteerState);

      if (updatedVolunteerState) {
        await api.addVolunteer(event.id, currentUserId);
        const currentUser = await api.getUser(currentUserId);
        if (currentUser.data) {
          setVolunteers((prev) => [...prev, currentUser.data]);
        }
      } else {
        await api.removeVolunteer(event.id, currentUserId);
        setVolunteers((prev) => prev.filter((v) => v.id !== currentUserId));
      }

      // Refresh event data
      const updatedEventData = await api.getEvent(event.id);
      if (updatedEventData?.data) {
        navigation.setParams({
          event: {
            ...event,
            volunteersIds: updatedEventData.data.volunteersIds,
          },
        });
        await AsyncStorage.setItem(
          `event_${event.id}`,
          JSON.stringify(updatedEventData.data)
        );
      }
    } catch (error) {
      console.error("Error toggling volunteer status:", error);
      setIsVolunteered(!updatedVolunteerState); // Revert the state in case of error
      Alert.alert(
        "Error",
        "Failed to update volunteer status. Please try again."
      );
    }
  }, [currentUserId, isVolunteered, event.id, navigation]);

  const renderVolunteerButton = useMemo(
    () => () => {
      if (!currentUserId) {
        return (
          <TouchableOpacity
            style={[styles.button, styles.volunteerButton]}
            onPress={() => Alert.alert("Error", "Please log in to volunteer")}
          >
            <Text style={styles.buttonText}>Log in to Volunteer</Text>
          </TouchableOpacity>
        );
      }

      if (isEventFull && !isVolunteered) {
        return (
          <View style={[styles.button, styles.fullButton]}>
            <Text style={styles.buttonText}>Event Full</Text>
          </View>
        );
      }

      return (
        <TouchableOpacity
          style={[
            styles.button,
            isVolunteered ? styles.unvolunteerButton : styles.volunteerButton,
          ]}
          onPress={handleVolunteerToggle}
        >
          <Text style={styles.buttonText}>
            {isVolunteered ? "Unvolunteer" : "Volunteer"}
          </Text>
        </TouchableOpacity>
      );
    },
    [currentUserId, isEventFull, isVolunteered, handleVolunteerToggle]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{event.name}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {event.imageUrl && typeof event.imageUrl === "string" && (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          )}

          <Text style={styles.description}>{event.description}</Text>
          <Text style={styles.dateTime}>{formatDate(event.dateTime)}</Text>
          <Text style={styles.volunteerCount}>
            {volunteers.length} of {event.volunteersNeeded} volunteers
          </Text>

          {renderVolunteerButton()}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowVolunteers(!showVolunteers)}
          >
            <Text style={styles.secondaryButtonText}>
              {showVolunteers ? "Hide Volunteers" : "Show Volunteers"}
            </Text>
          </TouchableOpacity>

          {showVolunteers && (
            <View style={styles.volunteersList}>
              <Text style={styles.volunteersTitle}>Current Volunteers:</Text>
              {volunteers.map((volunteer) => (
                <Text key={volunteer.id} style={styles.volunteerName}>
                  {volunteer.name.first} {volunteer.name.last}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => {
              /* Add your directions logic here */
            }}
          >
            <Text style={styles.buttonText}>Get Directions to Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32, // Add extra padding at bottom
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    fontFamily: "Nunito_700Bold",
  },
  eventImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  fullButton: {
    backgroundColor: "#9e9e9e", // Grey
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  dateTime: {
    fontSize: 18,
    marginBottom: 16,
    color: "#666",
    fontFamily: "Nunito_600SemiBold",
  },
  volunteerCount: {
    fontSize: 16,
    marginBottom: 16,
    color: "#666",
    fontFamily: "Nunito_600SemiBold",
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  volunteerButton: {
    backgroundColor: "#4CAF50",
  },
  unvolunteerButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#2196F3",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  directionsButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#607D8B",
  },
  volunteersList: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  volunteersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Nunito_700Bold",
  },
  volunteerName: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: "Nunito_600SemiBold",
  },
});

export default EventDetails;
