// CreateEvent.tsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Feather } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";
import { EventDetails } from "../@types/Events";
import { AuthenticationContext } from "../context/AuthenticationContext";
import * as api from "../services/api";
import {
  formatEventDate,
  formatEventTime,
  formatEventDayDate,
  isDateInPast,
  isValidTimeRange,
} from "../utils/dateFormat";
import { isAfter, isBefore } from "date-fns";

type RootStackParamList = {
  EventsMap: undefined;
  EventDetails: { event: EventDetails };
  CreateEvent: undefined;
};

type Props = StackScreenProps<RootStackParamList, "CreateEvent">;

export default function CreateEvent({ navigation }: Props) {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [volunteersNeeded, setVolunteersNeeded] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const authContext = useContext(AuthenticationContext);
  const predefinedImages = [
    {
      id: "skating",
      uri: require("../../assets/IceSkating.jpg"),
      label: "Ice Skating",
    },
    {
      id: "holiday-craft",
      uri: require("../../assets/4HHolidayCraftNight.png"),
      label: "Holiday Craft Night",
    },
    {
      id: "petting-zoo",
      uri: require("../../assets/PettingZoo.jpg"),
      label: "Petting Zoo",
    },
    {
      id: "santa-pictures",
      uri: require("../../assets/SantaPictures.jpg"),
      label: "Santa Pictures",
    },
    {
      id: "snow-shoveling",
      uri: require("../../assets/SnowShoveling.jpg"),
      label: "Snow Shoveling",
    },
  ];
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [location, setLocation] = useState({
    latitude: 51.105761,
    longitude: -114.106943,
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to upload an image!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setShowImagePicker(false);
    }
  };

  const ImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Image</Text>

          <ScrollView>
            {predefinedImages.map((image) => (
              <TouchableOpacity
                key={image.id}
                style={styles.imageOption}
                onPress={() => {
                  setImageUri(image.uri);
                  setShowImagePicker(false);
                }}
              >
                <Image source={image.uri} style={styles.thumbnailImage} />
                <Text style={styles.imageLabel}>{image.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <Feather name="upload" size={24} color="#fff" />
            <Text style={styles.optionButtonText}>Upload from device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, styles.cancelButton]}
            onPress={() => setShowImagePicker(false)}
          >
            <Text style={styles.optionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleSave = async () => {
    const now = new Date();

    if (!eventName || !description || !volunteersNeeded) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Check if the event start time is in the past
    if (isBefore(selectedDate, now)) {
      Alert.alert(
        "Invalid Date/Time",
        "Event start time must be in the future"
      );
      return;
    }

    // Check if end time is after start time
    if (!isAfter(selectedEndDate, selectedDate)) {
      Alert.alert("Invalid Time Range", "End time must be after start time");
      return;
    }

    try {
      // If using a predefined image, we need to convert the require() to a string URL
      let imageUrlToSave = null;
      if (imageUri) {
        if (typeof imageUri === "number") {
          // It's a local asset (require)
          imageUrlToSave = Image.resolveAssetSource(imageUri).uri;
        } else {
          // It's already a string URL
          imageUrlToSave = imageUri;
        }
      }

      const newEvent = {
        id: Date.now().toString(),
        name: eventName,
        description: description,
        dateTime: selectedDate.toISOString(),
        endDateTime: selectedEndDate.toISOString(),
        imageUrl: imageUrlToSave,
        position: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        volunteersNeeded: parseInt(volunteersNeeded),
        volunteersIds: [],
        organizerId: authContext?.value?.id,
      };

      const response = await api.createEvent(newEvent);
      console.log("New event created:", response.data);

      Alert.alert("Success", "Event created successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("EventsMap"),
        },
      ]);
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      if (isBefore(selectedDate, now)) {
        Alert.alert(
          "Invalid Date",
          "Please select a future date. Events cannot be created in the past."
        );
        return;
      }
      setSelectedDate(selectedDate);

      // Set end date to same day by default
      const endDate = new Date(selectedDate);
      endDate.setHours(selectedDate.getHours() + 4); // Default to 4 hours later
      setSelectedEndDate(endDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const now = new Date();
      const proposedDateTime = new Date(selectedDate);
      proposedDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      if (isBefore(proposedDateTime, now)) {
        Alert.alert(
          "Invalid Time",
          "Please select a future time. Events cannot be created in the past."
        );
        return;
      }

      const newDate = new Date(selectedDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(selectedEndDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setSelectedEndDate(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="x" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          <TouchableOpacity
            style={styles.imageUpload}
            onPress={() => setShowImagePicker(true)}
          >
            {imageUri ? (
              <Image
                source={
                  typeof imageUri === "string" ? { uri: imageUri } : imageUri
                }
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Feather name="image" size={40} color="#666" />
                <Text style={styles.uploadText}>Choose Event Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Enter event name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your event"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formatEventDayDate(selectedDate.toISOString())}</Text>
            </TouchableOpacity>

            <View style={styles.timeContainer}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text>
                  Start: {formatEventTime(selectedDate.toISOString())}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text>
                  End: {formatEventTime(selectedEndDate.toISOString())}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                onChange={onDateChange}
              />
            )}
            {showStartTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="time"
                onChange={onStartTimeChange}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={selectedEndDate}
                mode="time"
                onChange={onEndTimeChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                ...location,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={(e) => setLocation(e.nativeEvent.coordinate)}
            >
              <Marker coordinate={location} />
            </MapView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Volunteers Needed</Text>
            <TextInput
              style={styles.input}
              value={volunteersNeeded}
              onChangeText={setVolunteersNeeded}
              placeholder="Number of volunteers"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image</Text>

            <ScrollView>
              {predefinedImages.map((image) => (
                <TouchableOpacity
                  key={image.id}
                  style={styles.imageOption}
                  onPress={() => {
                    setImageUri(image.uri);
                    setShowImagePicker(false);
                  }}
                >
                  <Image source={image.uri} style={styles.thumbnailImage} />
                  <Text style={styles.imageLabel}>{image.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
              <Feather name="upload" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Upload from device</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.optionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for the save button
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  form: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#4B9DFF",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageUpload: {
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  uploadText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  imageLabel: {
    fontSize: 16,
  },
  optionButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
