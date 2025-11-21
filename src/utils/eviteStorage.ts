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

// Track recently deleted event IDs to prevent them from being re-synced
const recentlyDeletedIds = new Set<string>();
const DELETION_MEMORY_MS = 30000; // Remember deletions for 30 seconds

// Load all events from Supabase, fallback to localStorage
export async function loadEvents(): Promise<EviteEvent[]> {
  try {
    // Try Supabase first
    const { data, error } = await (supabase as any)
      .from("evite_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && Array.isArray(data)) {
      // Filter out recently deleted events to prevent them from reappearing
      const supabaseEvents = data
        .filter((e: any) => !recentlyDeletedIds.has(e.id))
        .map((e: any) => ({
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
      
      // Sync Supabase events to localStorage for consistency (excluding deleted ones)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseEvents));
        const filteredCount = data.length - supabaseEvents.length;
        if (filteredCount > 0) {
          console.log(`[eviteStorage] Loaded ${supabaseEvents.length} events from Supabase (filtered out ${filteredCount} recently deleted), synced to localStorage`);
        } else {
          console.log(`[eviteStorage] Loaded ${supabaseEvents.length} events from Supabase and synced to localStorage`);
        }
      } catch (syncErr) {
        console.warn("[eviteStorage] Failed to sync Supabase events to localStorage:", syncErr);
      }
      
      return supabaseEvents;
    }
    
    // If Supabase returns empty array, clear localStorage too
    if (!error && Array.isArray(data) && data.length === 0) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("[eviteStorage] Supabase returned empty, cleared localStorage");
      } catch (clearErr) {
        console.warn("[eviteStorage] Failed to clear localStorage:", clearErr);
      }
      return [];
    }
  } catch (err) {
    console.warn("Failed to load from Supabase, trying localStorage:", err);
  }

  // Fallback to localStorage only if Supabase fails
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const localEvents = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    // Also filter out recently deleted events from localStorage
    const filteredLocalEvents = localEvents.filter(e => !recentlyDeletedIds.has(e.id));
    if (filteredLocalEvents.length < localEvents.length) {
      // Update localStorage to remove deleted events
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLocalEvents));
    }
    console.log(`[eviteStorage] Loaded ${filteredLocalEvents.length} events from localStorage (Supabase fallback)`);
    return filteredLocalEvents;
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

// Delete event from Supabase and localStorage
export async function deleteEvent(id: string): Promise<void> {
  console.log(`[eviteStorage] Deleting event with ID: ${id}`);
  
  // Mark as recently deleted to prevent it from reappearing
  recentlyDeletedIds.add(id);
  // Auto-remove from memory after timeout
  setTimeout(() => {
    recentlyDeletedIds.delete(id);
    console.log(`[eviteStorage] Removed ${id} from deletion memory`);
  }, DELETION_MEMORY_MS);
  
  let localStorageDeleted = false;
  let supabaseDeleted = false;
  
  // Delete from localStorage FIRST to ensure immediate UI update
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as EviteEvent[];
      const beforeCount = list.length;
      const filtered = list.filter((e) => e.id !== id);
      const afterCount = filtered.length;
      
      if (beforeCount > afterCount) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        localStorageDeleted = true;
        console.log(`[eviteStorage] ✓ Event ${id} deleted from localStorage. ${beforeCount} → ${afterCount} events`);
      } else {
        console.warn(`[eviteStorage] Event ${id} not found in localStorage (${beforeCount} events)`);
      }
    } else {
      console.warn(`[eviteStorage] No events in localStorage to delete`);
    }
  } catch (err) {
    console.error("[eviteStorage] Error deleting from localStorage:", err);
    recentlyDeletedIds.delete(id); // Remove from memory on error
    throw new Error(`Failed to delete from localStorage: ${err}`);
  }

  // Then delete from Supabase
  try {
    const { data, error } = await (supabase as any)
      .from("evite_events")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error(`[eviteStorage] ✗ Failed to delete event ${id} from Supabase:`, error);
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("[eviteStorage] Table 'evite_events' does not exist. localStorage deletion succeeded.");
        // Don't throw - localStorage deletion succeeded, and we've marked it as deleted
        return;
      }
      // For other errors, throw if localStorage also failed
      if (!localStorageDeleted) {
        recentlyDeletedIds.delete(id); // Remove from memory on error
        throw new Error(`Supabase deletion failed: ${error.message}`);
      }
      console.warn(`[eviteStorage] Supabase deletion failed, but localStorage deletion succeeded. Event marked as deleted.`);
    } else {
      const deletedCount = data?.length || 0;
      if (deletedCount > 0) {
        supabaseDeleted = true;
        console.log(`[eviteStorage] ✓ Event ${id} deleted successfully from Supabase. Deleted ${deletedCount} row(s)`);
      } else {
        console.warn(`[eviteStorage] Event ${id} not found in Supabase (0 rows deleted), but marked as deleted in memory`);
      }
    }
  } catch (err) {
    console.error("[eviteStorage] Exception deleting from Supabase:", err);
    // If localStorage deletion succeeded, we can continue (event is marked as deleted)
    if (!localStorageDeleted) {
      recentlyDeletedIds.delete(id); // Remove from memory on error
      throw new Error(`Failed to delete from Supabase: ${err}`);
    }
    console.warn("[eviteStorage] Supabase deletion failed, but localStorage deletion succeeded. Event marked as deleted.");
  }
  
  // Verify deletion by checking if event still exists
  if (localStorageDeleted || supabaseDeleted) {
    console.log(`[eviteStorage] Deletion completed. localStorage: ${localStorageDeleted}, Supabase: ${supabaseDeleted}, Memory: marked`);
  }
}

