import {
  format,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";

// Format date for display
export const formatEventDate = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "MMM d, yyyy '@' h:mma");
};

// Format just the time
export const formatEventTime = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "h:mm a");
};

// Format just the date
export const formatEventDayDate = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "MMM d, yyyy");
};

// Check if a date is in the past (compare full dates including time)
export const isDateInPast = (dateString: string | Date) => {
  const now = new Date(); // Get current date and time
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;
  return isBefore(date, now);
};
// Check if an event is currently ongoing
export const isEventOngoing = (
  startDateString: string,
  endDateString: string
) => {
  const startDate = parseISO(startDateString);
  const endDate = parseISO(endDateString);
  const now = new Date();
  return isAfter(now, startDate) && isBefore(now, endDate);
};

// Format date range for display (handles same-day and different-day events)
export const formatEventDateRange = (
  startDateString: string,
  endDateString: string
) => {
  const startDate = parseISO(startDateString);
  const endDate = parseISO(endDateString);

  if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
    // Same day event
    return `${format(startDate, "MMM d, yyyy '@' h:mm a")} - ${format(
      endDate,
      "h:mm a"
    )}`;
  } else {
    // Multi-day event
    return `${format(startDate, "MMM d, yyyy '@' h:mm a")} - ${format(
      endDate,
      "MMM d, yyyy '@' h:mm a"
    )}`;
  }
};

// Get a formatted date string for the current time
export const getCurrentFormattedDate = () => {
  return format(new Date(), "MMM d, yyyy '@' h:mm a");
};

// Validate that end time is after start time
export const isValidTimeRange = (startDate: Date, endDate: Date) => {
  return isAfter(endDate, startDate);
};

// Format relative time (e.g., "starts in 2 hours" or "ended 3 days ago")
export const getEventStatus = (dateTime: string, endDateTime: string) => {
  const now = new Date();
  const startDate = parseISO(dateTime);
  const endDate = parseISO(endDateTime);

  if (isBefore(endDate, now)) {
    return "Past Event";
  } else if (isBefore(startDate, now) && isAfter(endDate, now)) {
    return "Ongoing";
  } else {
    return "Upcoming";
  }
};
