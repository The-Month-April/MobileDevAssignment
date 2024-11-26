// api.ts
import axios, { AxiosResponse } from "axios";
import { EventDetails } from "../@types/Events";
import { User } from "../types/User";

const api = axios.create({
  baseURL: "http://192.168.1.77:3333",
  headers: {
    "Content-Type": "application/json",
  },
});

export const createEvent = async (
  eventData: Partial<EventDetails>
): Promise<AxiosResponse> => {
  try {
    console.log("Creating event with data:", eventData);
    // Ensure imageUrl is a string or null
    const sanitizedEventData = {
      ...eventData,
      imageUrl:
        typeof eventData.imageUrl === "string" ? eventData.imageUrl : null,
      volunteersIds: eventData.volunteersIds || [],
      id: eventData.id || Date.now().toString(),
    };

    const response = await api.post("/events", sanitizedEventData);
    console.log("Event created successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error in createEvent:", error);
    throw error;
  }
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<AxiosResponse> => {
  try {
    console.log("Authenticating:", email);
    const usersResponse = await queryUsers(email);
    const user = usersResponse.data[0];

    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    const response = {
      data: {
        user: userWithoutPassword,
        accessToken: "dummy-token-" + Date.now(),
      },
    };

    console.log("Auth successful:", response.data);
    return response as AxiosResponse;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const getEvents = (): Promise<AxiosResponse<EventDetails[]>> => {
  console.log("Fetching events from API");
  return api.get("/events");
};

export const getUser = async (userId: string): Promise<AxiosResponse<User>> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response;
  } catch (error) {
    console.log(`User ${userId} not found, returning placeholder`);
    return {
      data: {
        id: userId,
        name: { first: "Unknown", last: "User" },
        email: "",
        mobile: "",
      },
    } as AxiosResponse<User>;
  }
};

export const addVolunteer = async (
  eventId: string,
  userId: string
): Promise<AxiosResponse<EventDetails>> => {
  try {
    const { data: event } = await api.get<EventDetails>(`/events/${eventId}`);
    if (!event.volunteersIds) {
      event.volunteersIds = [];
    }
    const updatedVolunteers = [...event.volunteersIds, userId];
    const response = await api.patch(`/events/${eventId}`, {
      volunteersIds: updatedVolunteers,
    });
    console.log("Volunteer added successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error adding volunteer:", error);
    throw error;
  }
};

export const removeVolunteer = async (
  eventId: string,
  userId: string
): Promise<AxiosResponse<EventDetails>> => {
  try {
    const { data: event } = await api.get<EventDetails>(`/events/${eventId}`);
    const updatedVolunteers = event.volunteersIds.filter((id) => id !== userId);
    console.log("Before removal:", event.volunteersIds);
    console.log("After removal:", updatedVolunteers);
    const response = await api.patch(`/events/${eventId}`, {
      volunteersIds: updatedVolunteers,
    });
    console.log("Update response:", response.data);
    return response;
  } catch (error) {
    console.error("Error in removeVolunteer:", error);
    throw error;
  }
};

export const queryUsers = (email: string): Promise<AxiosResponse<User[]>> => {
  return api.get(`/users`, {
    params: {
      email: email,
    },
  });
};

export const getEvent = (
  eventId: string
): Promise<AxiosResponse<EventDetails>> => {
  return api.get(`/events/${eventId}`);
};
