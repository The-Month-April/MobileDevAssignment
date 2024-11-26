import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as api from "../services/api";
import { User } from "../types/User";

interface VolunteerListProps {
  volunteers: string[];
}

export const VolunteerList: React.FC<VolunteerListProps> = ({ volunteers }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const responses = await Promise.all(
          volunteers.map((id) => api.getUser(id))
        );
        setUsers(responses.map((res) => res.data));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [volunteers]);

  return (
    <View style={styles.volunteerList}>
      <Text style={styles.volunteerTitle}>Volunteers:</Text>
      {users.map((user) => (
        <Text key={user.id}>
          {user.name.first} {user.name.last}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  volunteerList: {
    marginTop: 20,
    padding: 10,
  },
  volunteerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
