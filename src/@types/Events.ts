export interface EventDetails {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  endDateTime?: string;
  imageUrl?: string | null; // Changed to allow null
  position: {
    latitude: number;
    longitude: number;
  };
  volunteersNeeded: number;
  volunteersIds: string[]; // Changed from never[]
  organizerId?: string;
}
