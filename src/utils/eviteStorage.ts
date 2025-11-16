import { supabase } from "@/integrations/supabase/client";

export interface Kid {
  name: string;
  age: number;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string; // Phone number for SMS
  status: "pending" | "accepted" | "declined";
  // RSVP details (only if accepted)
  foodPreference?: "veg" | "non-veg" | "both";
  numberOfAttendees?: number;
  numberOfAdults?: number;
  numberOfKids?: number;
  kids?: Kid[];
  dietaryPreferences?: string;
  note?: string;
}

export interface EviteEvent {
  id: string;
  title: string;
  hostName: string;
  date: string;
  time: string;
  location: string;
  description: string;
  template: string;
  guests: Guest[];
  // Optional customization
  useCustomImages?: boolean;
  customStyle?: "classic" | "elegant" | "kids" | "minimal";
  customImages?: string[]; // public URLs
  createdAt: number;
}

const STORAGE_KEY = "partyify-evite-events";

// Load event from Supabase, fallback to localStorage
export async function loadEvent(id: string): Promise<EviteEvent | null> {
  console.log(`[eviteStorage] Loading event with ID: ${id}`);
  
  try {
    // Try Supabase first
    const { data, error } = await (supabase as any)
      .from("evite_events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.warn(`[eviteStorage] Supabase error for event ${id}:`, error);
      // If table doesn't exist, error code is usually 42P01 or similar
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.error("[eviteStorage] Table 'evite_events' does not exist! Please run SUPABASE_TABLE_SETUP.sql");
      }
    } else if (data) {
      console.log(`[eviteStorage] Event found in Supabase:`, data);
      return {
        id: data.id,
        title: data.title,
        hostName: data.host_name,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description || "",
        template: data.template || "classic",
        guests: (data.guests as Guest[]) || [],
        useCustomImages: data.use_custom_images ?? false,
        customStyle: (data.custom_style as any) ?? undefined,
        customImages: (data.custom_images as string[]) ?? [],
        createdAt: new Date(data.created_at).getTime(),
      } as EviteEvent;
    } else {
      console.warn(`[eviteStorage] No event found in Supabase for ID: ${id}`);
    }
  } catch (err) {
    console.error("[eviteStorage] Exception loading from Supabase:", err);
  }

  // Fallback to localStorage
  console.log(`[eviteStorage] Trying localStorage fallback for event ${id}`);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    const found = list.find((e) => e.id === id);
    if (found) {
      console.log(`[eviteStorage] Event found in localStorage:`, found);
      return found;
    } else {
      console.warn(`[eviteStorage] Event not found in localStorage. Available IDs:`, list.map(e => e.id));
    }
  } catch (err) {
    console.error("[eviteStorage] Error reading localStorage:", err);
  }

  console.error(`[eviteStorage] Event ${id} not found in Supabase or localStorage`);
  return null;
}

// Load all events from Supabase, fallback to localStorage
export async function loadEvents(): Promise<EviteEvent[]> {
  try {
    // Try Supabase first
    const { data, error } = await (supabase as any)
      .from("evite_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((e: any) => ({
        id: e.id,
        title: e.title,
        hostName: e.host_name,
        date: e.date,
        time: e.time,
        location: e.location,
        description: e.description || "",
        template: e.template || "classic",
        guests: (e.guests as Guest[]) || [],
        useCustomImages: e.use_custom_images ?? false,
        customStyle: (e.custom_style as any) ?? undefined,
        customImages: (e.custom_images as string[]) ?? [],
        createdAt: new Date(e.created_at).getTime(),
      })) as EviteEvent[];
    }
  } catch (err) {
    console.warn("Failed to load from Supabase, trying localStorage:", err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EviteEvent[]) : [];
  } catch {
    return [];
  }
}

// Save event to Supabase and localStorage
export async function saveEvent(event: EviteEvent): Promise<void> {
  console.log(`[eviteStorage] Saving event ${event.id} to Supabase`);
  
  try {
    // Save to Supabase
    const { error } = await (supabase as any)
      .from("evite_events")
      .upsert({
        id: event.id,
        title: event.title,
        host_name: event.hostName,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description || "",
        template: event.template,
        guests: event.guests || [],
        use_custom_images: event.useCustomImages ?? false,
        custom_style: event.customStyle ?? null,
        custom_images: event.customImages ?? [],
        created_at: new Date(event.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    if (error) {
      console.error(`[eviteStorage] Failed to save event ${event.id} to Supabase:`, error);
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.error("[eviteStorage] Table 'evite_events' does not exist! Please run SUPABASE_TABLE_SETUP.sql");
      }
    } else {
      console.log(`[eviteStorage] Event ${event.id} saved successfully to Supabase`);
    }
  } catch (err) {
    console.error("[eviteStorage] Exception saving to Supabase:", err);
  }

  // Also save to localStorage as backup
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    const next = list.find((e) => e.id === event.id)
      ? list.map((e) => (e.id === event.id ? event : e))
      : [event, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// Save all events
export async function saveEvents(events: EviteEvent[]): Promise<void> {
  // Save each event to Supabase
  for (const event of events) {
    await saveEvent(event);
  }
}

