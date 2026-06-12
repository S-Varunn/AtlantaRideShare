import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RideStatus =
  | "booking_requested"
  | "pending_assignment"
  | "fully_assigned"
  | "driver_en_route"
  | "driver_arrived"
  | "ride_started"
  | "completed"
  | "cancelled";

export type RideType =
  | "airport_pickup"
  | "airport_dropoff"
  | "corporate_ride"
  | "hourly_ride"
  | "hotel_transfer"
  | "scheduled_ride";

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  rating: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  year: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading: number;
}

export interface RideNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Ride {
  id: string;
  bookingId: string;
  status: RideStatus;
  rideType: RideType;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  luggage: number;
  flightNumber?: string;
  specialInstructions?: string;
  estimatedFare: string;
  driver?: Driver;
  vehicle?: Vehicle;
  driverLocation?: DriverLocation;
  createdAt: string;
  updatedAt: string;
  notifications: RideNotification[];
}

export interface CreateRideInput {
  rideType: RideType;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  luggage: number;
  flightNumber?: string;
  specialInstructions?: string;
  customerName?: string;
  estimatedFare?: string;
  estimatedDistance?: string;
}

interface RideContextType {
  rides: Ride[];
  isLoading: boolean;
  createRide: (data: CreateRideInput) => Promise<Ride>;
  cancelRide: (rideId: string) => Promise<void>;
  getActiveRide: () => Ride | undefined;
  getUpcomingRides: () => Ride[];
  getCompletedRides: () => Ride[];
  getCancelledRides: () => Ride[];
  markNotificationsRead: (rideId: string) => Promise<void>;
  getTotalUnreadNotifications: () => number;
  refreshRides: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapRow(row: any): Ride {
  const driver = row.driver
    ? {
        id: row.driver.id,
        firstName: row.driver.first_name,
        lastName: row.driver.last_name,
        phone: row.driver.phone ?? "",
        rating: Number(row.driver.rating ?? 5),
      }
    : undefined;

  const vehicle = row.vehicle
    ? {
        id: row.vehicle.id,
        make: row.vehicle.make,
        model: row.vehicle.model,
        color: row.vehicle.color ?? "",
        licensePlate: row.vehicle.license_plate ?? "",
        year: row.vehicle.year ?? 0,
      }
    : undefined;

  const notifications: RideNotification[] = (row.notifications ?? [])
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      read: n.is_read,
    }));

  return {
    id: row.id,
    bookingId: row.booking_id,
    status: row.status as RideStatus,
    rideType: row.ride_type as RideType,
    pickupAddress: row.pickup_address,
    pickupLat: row.pickup_lat ?? undefined,
    pickupLng: row.pickup_lng ?? undefined,
    dropoffAddress: row.dropoff_address,
    dropoffLat: row.dropoff_lat ?? undefined,
    dropoffLng: row.dropoff_lng ?? undefined,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    passengers: row.passengers,
    luggage: row.luggage,
    flightNumber: row.flight_number ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    estimatedFare: row.estimated_fare ?? "$65 – $95",
    driver,
    vehicle,
    driverLocation: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notifications,
  };
}

function generateBookingId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BK-${year}-${rand}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const userId = session?.user?.id;

  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadRides = useCallback(async () => {
    if (!userId) {
      setRides([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(
          `*, driver:drivers(*), vehicle:vehicles(*), notifications:ride_notifications(*)`
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRides((data ?? []).map(mapRow));
    } catch (err) {
      console.warn("RideContext: loadRides error", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  // ── Realtime ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const ch = supabase
      .channel(`rides:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: `user_id=eq.${userId}`,
        },
        () => loadRides()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_notifications" },
        () => loadRides()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        () => loadRides()
      )
      .subscribe();

    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [userId, loadRides]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  async function createRide(data: CreateRideInput): Promise<Ride> {
    if (!userId) throw new Error("Not authenticated");

    const bookingId = generateBookingId();

    const { data: row, error } = await supabase
      .from("rides")
      .insert({
        user_id: userId,
        booking_id: bookingId,
        status: "booking_requested",
        ride_type: data.rideType,
        pickup_address: data.pickupAddress,
        pickup_lat: data.pickupLat ?? null,
        pickup_lng: data.pickupLng ?? null,
        dropoff_address: data.dropoffAddress,
        dropoff_lat: data.dropoffLat ?? null,
        dropoff_lng: data.dropoffLng ?? null,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        passengers: data.passengers,
        luggage: data.luggage,
        flight_number: data.flightNumber ?? null,
        special_instructions: data.specialInstructions ?? null,
        customer_name: data.customerName ?? null,
        estimated_fare: data.estimatedFare ?? null,
        estimated_distance: data.estimatedDistance ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Initial notification
    await supabase.from("ride_notifications").insert({
      ride_id: row.id,
      user_id: userId,
      title: "Ride Requested",
      message:
        "Your ride request has been received. Our dispatch team will review your booking and assign your driver and vehicle shortly.",
    });

    await loadRides();

    // Return a minimal mapped ride so the confirmation screen gets the bookingId immediately
    return mapRow({ ...row, driver: null, vehicle: null, notifications: [] });
  }

  async function cancelRide(rideId: string): Promise<void> {
    if (!userId) return;

    const { error } = await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .eq("id", rideId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    await supabase.from("ride_notifications").insert({
      ride_id: rideId,
      user_id: userId,
      title: "Ride Cancelled",
      message: "Your ride has been cancelled as requested.",
    });

    await loadRides();
  }

  async function markNotificationsRead(rideId: string): Promise<void> {
    if (!userId) return;
    await supabase
      .from("ride_notifications")
      .update({ is_read: true })
      .eq("ride_id", rideId)
      .eq("user_id", userId);

    setRides((prev) =>
      prev.map((r) =>
        r.id === rideId
          ? { ...r, notifications: r.notifications.map((n) => ({ ...n, read: true })) }
          : r
      )
    );
  }

  // ── Selectors ────────────────────────────────────────────────────────────────
  function getActiveRide(): Ride | undefined {
    return rides.find((r) =>
      ["driver_en_route", "driver_arrived", "ride_started", "fully_assigned"].includes(r.status)
    );
  }

  function getUpcomingRides(): Ride[] {
    return rides.filter((r) =>
      ["booking_requested", "pending_assignment", "fully_assigned"].includes(r.status)
    );
  }

  function getCompletedRides(): Ride[] {
    return rides.filter((r) => r.status === "completed");
  }

  function getCancelledRides(): Ride[] {
    return rides.filter((r) => r.status === "cancelled");
  }

  function getTotalUnreadNotifications(): number {
    return rides.reduce(
      (total, ride) => total + ride.notifications.filter((n) => !n.read).length,
      0
    );
  }

  return (
    <RideContext.Provider
      value={{
        rides,
        isLoading,
        createRide,
        cancelRide,
        getActiveRide,
        getUpcomingRides,
        getCompletedRides,
        getCancelledRides,
        markNotificationsRead,
        getTotalUnreadNotifications,
        refreshRides: loadRides,
      }}
    >
      {children}
    </RideContext.Provider>
  );
}

export function useRides() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRides must be used within RideProvider");
  return ctx;
}
