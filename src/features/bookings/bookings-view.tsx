import { getBookings } from "@/actions/booking.actions";
import { BookingsContent } from "./bookings-content";

export async function BookingsView() {
  const bookings = await getBookings();
  return <BookingsContent bookings={JSON.parse(JSON.stringify(bookings))} />;
}
