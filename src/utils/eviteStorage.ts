import { supabase } from "@/integrations/supabase/client";

export interface Guest {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "declined";
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
  createdAt: number;
}

const STORAGE_KEY = "partyify-evite-events";

// Load event from Supabase, fallback to localStorage
export async function loadEvent(id: string): Promise<EviteEvent | null> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from("evite_events")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
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
        createdAt: new Date(data.created_at).getTime(),
      } as EviteEvent;
    }
  } catch (err) {
    console.warn("Failed to load from Supabase, trying localStorage:", err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    return list.find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}

// Load all events from Supabase, fallback to localStorage
export async function loadEvents(): Promise<EviteEvent[]> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
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
  try {
    // Save to Supabase
    const { error } = await supabase
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
        created_at: new Date(event.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: "id",
      });

    if (error) {
      console.warn("Failed to save to Supabase:", error);
    }
  } catch (err) {
    console.warn("Error saving to Supabase:", err);
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

