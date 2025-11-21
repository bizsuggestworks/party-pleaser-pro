import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Copy, Mail, Plus, Trash2, Users, ClipboardCheck, Palette, MessageSquare, User, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEvents, loadEvent, saveEvents, saveEvent, deleteEvent as deleteEventFromStorage, type EviteEvent, type Guest } from "@/utils/eviteStorage";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { LoginScreen } from "@/components/LoginScreen";

type GuestStatus = "pending" | "accepted" | "declined";

const TEMPLATES = [
  { id: "classic", name: "Classic Confetti" },
  { id: "elegant", name: "Elegant Rose Gold" },
  { id: "kids", name: "Kids Party Fun" },
  { id: "minimal", name: "Minimal Modern" },
];

export default function Evite() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const [tab, setTab] = useState("create");

  const [events, setEvents] = useState<EviteEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Load events from Supabase on mount (filtered by user ID)
  useEffect(() => {
    async function fetchEvents() {
      if (authLoading) {
        return; // Wait for auth to load
      }
      
      try {
        console.log("[Evite] Loading events for user:", user?.id || "not logged in");
        const loadedEvents = await loadEvents(user?.id);
        console.log(`[Evite] Loaded ${loadedEvents.length} events:`, loadedEvents.map(e => ({ id: e.id, title: e.title, hasImages: !!e.customImages?.length })));
        setEvents(loadedEvents);
        if (loadedEvents.length > 0 && !activeEventId) {
          setActiveEventId(loadedEvents[0].id);
          console.log(`[Evite] Set active event to: ${loadedEvents[0].id}`);
        }
      } catch (error) {
        console.error("[Evite] Failed to load events:", error);
        // Try to load from localStorage as fallback (filtered by user ID)
        try {
          const raw = localStorage.getItem("partyify-evite-events");
          if (raw) {
            const allLocalEvents = JSON.parse(raw) as EviteEvent[];
            // Filter by user ID if logged in
            const localEvents = user?.id 
              ? allLocalEvents.filter(e => e.userId === user.id)
              : allLocalEvents.filter(e => !e.userId); // Show events without userId for backward compatibility
            console.log(`[Evite] Loaded ${localEvents.length} events from localStorage fallback`);
            setEvents(localEvents);
            if (localEvents.length > 0 && !activeEventId) {
              setActiveEventId(localEvents[0].id);
            }
          }
        } catch (localError) {
          console.error("[Evite] Failed to load from localStorage:", localError);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user?.id, authLoading]);

  const [draft, setDraft] = useState<Omit<EviteEvent, "id" | "guests" | "createdAt">>({
    title: "",
    hostName: "",
    date: "",
    time: "",
    location: "",
    description: "",
    template: TEMPLATES[0].id,
  });

  // Customization state (optional photo-based invite)
  const [customizeEnabled, setCustomizeEnabled] = useState(false);
  const [customStyle, setCustomStyle] = useState<"classic" | "elegant" | "kids" | "minimal">("classic");
  const [customFiles, setCustomFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTransformPreview, setShowTransformPreview] = useState(false);
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageApproved, setImageApproved] = useState<boolean | null>(null);

  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "" });

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) ?? null,
    [events, activeEventId]
  );

  // Populate draft form when active event changes
  useEffect(() => {
    if (activeEvent) {
      setDraft({
        title: activeEvent.title || "",
        hostName: activeEvent.hostName || "",
        date: activeEvent.date || "",
        time: activeEvent.time || "",
        location: activeEvent.location || "",
        description: activeEvent.description || "",
        template: activeEvent.template || TEMPLATES[0].id,
      });
      setCustomizeEnabled(activeEvent.useCustomImages || false);
      setCustomStyle(activeEvent.customStyle || "classic");
      setCustomFiles([]); // Clear file selection when switching events
      setImageApproved(null); // Reset approval state
      setTransformedImageUrl(null); // Reset transformed image
      setOriginalImageUrl(null); // Reset original image
    } else {
      // Reset to empty form when no event is selected
      setDraft({
        title: "",
        hostName: "",
        date: "",
        time: "",
        location: "",
        description: "",
        template: TEMPLATES[0].id,
      });
      setCustomizeEnabled(false);
      setCustomStyle("classic");
      setCustomFiles([]);
      setImageApproved(null); // Reset approval state
      setTransformedImageUrl(null); // Reset transformed image
      setOriginalImageUrl(null); // Reset original image
    }
  }, [activeEventId, activeEvent]);

  // Note: We don't auto-save all events on every change anymore
  // Individual operations (create, update, delete) handle their own persistence

  const createEvent = async () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create events. Your events will be saved to your account.",
        variant: "destructive",
      });
      return;
    }
    
    if (!draft.title || !draft.date || !draft.time || !draft.location) {
      toast({
        title: "Missing details",
        description: "Please fill in title, date, time, and location.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we're updating an existing event or creating a new one
    const isUpdating = activeEventId && activeEvent;
    const id = isUpdating ? activeEventId : String(Date.now());
    
    const eventData: EviteEvent = {
      id,
      userId: user.id, // Associate event with user ID
      ...draft,
      // Preserve existing guests and images when updating
      guests: isUpdating ? (activeEvent?.guests || []) : [],
      useCustomImages: customizeEnabled,
      customStyle: customizeEnabled ? customStyle : undefined,
      customImages: isUpdating ? (activeEvent?.customImages || []) : [],
      createdAt: isUpdating ? (activeEvent?.createdAt || Date.now()) : Date.now(),
    };
    
    // Update local state first for immediate UI update
    if (isUpdating) {
      setEvents((prev) => prev.map((e) => (e.id === id ? eventData : e)));
    } else {
      setEvents((prev) => [eventData, ...prev]);
    setActiveEventId(id);
    }
    
    // Save to Supabase
    try {
      // If customization enabled and files selected, upload and update event
      // Only include image if user approved it (imageApproved === true)
      if (customizeEnabled && customFiles.length > 0 && imageApproved === true && transformedImageUrl) {
        setIsUploading(true);
        const uploadedUrls: string[] = [];
        console.log(`[Evite] Uploading ${customFiles.length} files for event ${id}`);
        
        // Try to check if bucket exists (may fail due to permissions, but that's okay)
        try {
          const { data: buckets, error: bucketError } = await (supabase as any).storage.listBuckets();
          if (bucketError) {
            console.warn("[Evite] Could not list buckets (permission issue, but will try upload anyway):", bucketError);
            // Don't fail - just try the upload
          } else {
            const bucketExists = buckets?.some((b: any) => b.name === "evite-uploads");
            if (bucketExists) {
              console.log("[Evite] ✓ Bucket 'evite-uploads' exists");
            } else {
              console.warn("[Evite] Bucket 'evite-uploads' not found in list, but will try upload anyway");
              // Don't fail - the bucket might exist but we don't have permission to list it
            }
          }
        } catch (checkError) {
          console.warn("[Evite] Could not check bucket existence (will try upload anyway):", checkError);
          // Continue with upload attempt
        }
        
        // Upload and transform the single photo
        const file = customFiles[0];
        const timestamp = Date.now();
        const originalPath = `evite-uploads/${id}/original_${timestamp}_${file.name}`;
        console.log(`[Evite] Uploading photo for Ghibli transformation:`);
        console.log(`[Evite]   Name: ${file.name}`);
        console.log(`[Evite]   Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`[Evite]   Type: ${file.type}`);
        
        try {
          // Step 1: Upload original image
          const { data: up, error: upErr } = await (supabase as any).storage.from("evite-uploads").upload(originalPath, file, {
            cacheControl: "3600",
            upsert: false,
          });
          
          if (upErr) {
            console.error("[Evite] Upload error details:", {
              error: upErr,
              message: upErr.message,
              statusCode: upErr.statusCode,
              errorCode: upErr.error,
              fullError: JSON.stringify(upErr, null, 2)
            });
            
            const errorMsg = upErr.message || String(upErr);
            
            // Provide helpful error messages
            if (errorMsg.includes("Bucket not found") || errorMsg.includes("does not exist")) {
              toast({ 
                title: "Storage bucket not found", 
                description: "Please create 'evite-uploads' bucket in Supabase Dashboard → Storage",
                variant: "destructive",
                duration: 10000
              });
            } else if (errorMsg.includes("new row violates row-level security") || errorMsg.includes("RLS")) {
              toast({ 
                title: "Permission denied", 
                description: "Storage bucket needs public access. Check bucket policies in Supabase Dashboard → Storage → evite-uploads → Policies",
                variant: "destructive",
                duration: 10000
              });
            } else if (errorMsg.includes("JWT") || errorMsg.includes("auth")) {
              toast({ 
                title: "Authentication error", 
                description: "Please sign in to upload images. Check if you're logged in.",
                variant: "destructive",
                duration: 10000
              });
            } else {
              toast({ 
                title: "Upload failed", 
                description: errorMsg.length > 100 ? errorMsg.substring(0, 100) + "..." : errorMsg, 
                variant: "destructive",
                duration: 10000
              });
            }
            setIsUploading(false);
            return;
          }
          
          if (!up || !up.path) {
            console.error(`[Evite] Upload succeeded but no data returned. Response:`, up);
            toast({ 
              title: "Upload incomplete", 
              description: "File uploaded but could not get file path. Check console for details.",
              variant: "destructive",
              duration: 10000
            });
            setIsUploading(false);
            return;
          }
          
          console.log(`[Evite] ✓ Original image uploaded:`, up.path);
          
          // Get public URL of original
          const { data: pub } = (supabase as any).storage.from("evite-uploads").getPublicUrl(up.path);
          if (!pub?.publicUrl) {
            console.error(`[Evite] Failed to get public URL`);
            toast({ 
              title: "URL generation failed", 
              description: "File uploaded but could not generate public URL.",
              variant: "destructive",
              duration: 10000
            });
            setIsUploading(false);
            return;
          }
          
          console.log(`[Evite] Original image URL: ${pub.publicUrl}`);
          
          // Step 2: Transform image to Ghibli style
          console.log(`[Evite] Transforming image to Ghibli art style...`);
          toast({ 
            title: "Transforming image", 
            description: "Converting your photo to Studio Ghibli art style...",
            duration: 5000
          });
          
          try {
            const { data: transformData, error: transformError } = await supabase.functions.invoke("transform-image", {
              body: { 
                imageUrl: pub.publicUrl,
                eventTitle: draft.title
              },
            });
            
            console.log("[Evite] Transform response:", { transformData, transformError });
            
            if (transformError) {
              console.warn("[Evite] Image transformation failed, using original:", transformError);
              console.warn("[Evite] Error details:", JSON.stringify(transformError, null, 2));
              // Use original image if transformation fails
              uploadedUrls.push(pub.publicUrl);
            } else if (transformData?.transformedImageUrl && transformData.transformedImageUrl !== pub.publicUrl) {
              console.log(`[Evite] ✓✓✓ Image transformed to Ghibli style! ✓✓✓`);
              console.log(`[Evite] Original URL: ${pub.publicUrl}`);
              console.log(`[Evite] Transformed URL: ${transformData.transformedImageUrl}`);
              // Use the transformed image that was already previewed and approved
              uploadedUrls.push(transformedImageUrl || transformData.transformedImageUrl);
            } else {
              console.warn("[Evite] No transformed image URL returned or same as original");
              console.warn("[Evite] Transform data:", transformData);
              // Use the transformed image that was already previewed and approved, or original if no preview
              if (transformedImageUrl) {
                uploadedUrls.push(transformedImageUrl);
              } else {
            uploadedUrls.push(pub.publicUrl);
          }
        }
          } catch (transformException) {
            console.error("[Evite] Transformation exception:", transformException);
            console.error("[Evite] Exception details:", transformException instanceof Error ? transformException.message : String(transformException));
            // Use original image if transformation fails
            uploadedUrls.push(pub.publicUrl);
          }
        } catch (uploadException) {
          console.error(`[Evite] Exception during upload:`, uploadException);
          toast({ 
            title: "Upload exception", 
            description: uploadException instanceof Error ? uploadException.message : String(uploadException),
            variant: "destructive",
            duration: 10000
          });
          setIsUploading(false);
          return;
        }
        
        console.log(`[Evite] All files uploaded. Total URLs: ${uploadedUrls.length}`, uploadedUrls);
        const updatedEvent: EviteEvent = { ...eventData, customImages: uploadedUrls };
        await saveEvent(updatedEvent);
        
        // Update local state with images
        setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
        console.log(`[Evite] Event ${id} ${isUpdating ? 'updated' : 'saved'} with ${uploadedUrls.length} custom images`);
      } else if (customizeEnabled && isUpdating && activeEvent?.customImages && activeEvent.customImages.length > 0 && imageApproved !== false) {
        // Preserve existing images when updating without new files (only if not explicitly denied)
        const updatedEvent: EviteEvent = { ...eventData, customImages: activeEvent.customImages };
        await saveEvent(updatedEvent);
        setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
        console.log(`[Evite] Event ${id} updated, preserving existing ${activeEvent.customImages.length} custom images`);
      } else if (customizeEnabled && imageApproved === false) {
        // User denied the image, save without images
        const updatedEvent: EviteEvent = { ...eventData, customImages: [], useCustomImages: false };
        await saveEvent(updatedEvent);
        setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
        console.log(`[Evite] Event ${id} saved without images (user denied)`);
      } else {
        await saveEvent(eventData);
        console.log(`[Evite] Event ${id} ${isUpdating ? 'updated' : 'saved'} without custom images`);
      }
      
      // Reload events to ensure consistency
      const reloadedEvents = await loadEvents();
      setEvents(reloadedEvents);
      console.log(`[Evite] Reloaded ${reloadedEvents.length} events after ${isUpdating ? 'update' : 'creation'}`);
      
      // If updating and there are guests, automatically send updated invites
      if (isUpdating && eventData.guests.length > 0) {
        console.log(`[Evite] Event updated with ${eventData.guests.length} guests, sending update invites...`);
        try {
          const latestEvent = await loadEvent(id);
          const eventToSend = latestEvent || eventData;
          
          const { data, error } = await supabase.functions.invoke("send-evites", {
            body: { 
              event: eventToSend, 
              origin: window.location.origin,
              isUpdate: true // Flag to indicate this is an update
            },
          });
          
          if (error) {
            console.error("[Evite] Failed to send update invites:", error);
            toast({
              title: "Event updated",
              description: "Failed to send update invites. You can send them manually from the Share tab.",
              variant: "default",
            });
          } else {
            const sent = data?.sent ?? 0;
            const failed = data?.failed || [];
            const failedCount = failed.length;
            
            if (failedCount > 0) {
              toast({
                title: "Event updated",
                description: `Sent ${sent} update invite${sent === 1 ? "" : "s"}, ${failedCount} failed.`,
                variant: "default",
              });
            } else {
              toast({
                title: "Event updated",
                description: `Sent ${sent} update invite${sent === 1 ? "" : "s"} to all guests.`,
              });
            }
          }
        } catch (inviteError) {
          console.error("[Evite] Error sending update invites:", inviteError);
          toast({
            title: "Event updated",
            description: "Failed to send update invites. You can send them manually from the Share tab.",
            variant: "default",
          });
        }
      }
    } finally {
      setIsUploading(false);
    }
    
    if (!isUpdating || eventData.guests.length === 0) {
      toast({ 
        title: isUpdating ? "Event updated" : "Event created", 
        description: isUpdating ? "Update invites will be sent automatically." : "Share your invite link with guests." 
      });
    }
  };

  const deleteEvent = async (id: string) => {
    console.log(`[Evite] Starting deletion of event ${id}`);
    const eventToDelete = events.find(e => e.id === id);
    console.log(`[Evite] Event to delete:`, eventToDelete?.title || 'not found');
    
    // Optimistically update UI first
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    if (activeEventId === id) {
      setActiveEventId(next.length > 0 ? next[0].id : null);
    }
    
    try {
      // Delete associated images from Supabase Storage first
      if (eventToDelete?.customImages && eventToDelete.customImages.length > 0) {
        console.log(`[Evite] Deleting ${eventToDelete.customImages.length} image(s) associated with event ${id}`);
        try {
          for (const imageUrl of eventToDelete.customImages) {
            try {
              // Extract the path from the URL
              // URL format: https://[project].supabase.co/storage/v1/object/public/evite-uploads/[path]
              const urlParts = imageUrl.split('/evite-uploads/');
              if (urlParts.length > 1) {
                const imagePath = urlParts[1].split('?')[0]; // Remove query params
                console.log(`[Evite] Deleting image: ${imagePath}`);
                
                const { error: deleteError } = await (supabase as any).storage
                  .from("evite-uploads")
                  .remove([imagePath]);
                
                if (deleteError) {
                  console.warn(`[Evite] Failed to delete image ${imagePath}:`, deleteError);
                } else {
                  console.log(`[Evite] ✓ Deleted image: ${imagePath}`);
                }
              } else {
                console.warn(`[Evite] Could not extract path from image URL: ${imageUrl}`);
              }
            } catch (imgError) {
              console.warn(`[Evite] Error deleting image ${imageUrl}:`, imgError);
              // Continue with other images even if one fails
            }
          }
          
          // Also try to delete the entire event folder if it exists
          try {
            const eventFolderPath = `${id}/`;
            const { data: folderFiles, error: listError } = await (supabase as any).storage
              .from("evite-uploads")
              .list(eventFolderPath);
            
            if (!listError && folderFiles && folderFiles.length > 0) {
              const filesToDelete = folderFiles.map((file: any) => `${eventFolderPath}${file.name}`);
              console.log(`[Evite] Deleting ${filesToDelete.length} files from event folder: ${eventFolderPath}`);
              
              const { error: folderDeleteError } = await (supabase as any).storage
                .from("evite-uploads")
                .remove(filesToDelete);
              
              if (folderDeleteError) {
                console.warn(`[Evite] Failed to delete event folder:`, folderDeleteError);
              } else {
                console.log(`[Evite] ✓ Deleted event folder: ${eventFolderPath}`);
              }
            }
          } catch (folderError) {
            console.warn(`[Evite] Error deleting event folder:`, folderError);
            // Continue with database deletion even if folder deletion fails
          }
        } catch (storageError) {
          console.warn(`[Evite] Error during image deletion:`, storageError);
          // Continue with database deletion even if image deletion fails
        }
      }
      
      // Delete from Supabase database and localStorage
      await deleteEventFromStorage(id);
      console.log(`[Evite] ✓ Event ${id} deleted from database and storage`);
      
      // Clear form if deleting the active event
      if (activeEventId === id) {
        setActiveEventId(null);
        // Reset form to empty
        setDraft({
          title: "",
          hostName: "",
          date: "",
          time: "",
          location: "",
          description: "",
          template: TEMPLATES[0].id,
        });
        setCustomizeEnabled(false);
        setCustomStyle("classic");
        setCustomFiles([]);
        setImageApproved(null);
        setTransformedImageUrl(null);
        setOriginalImageUrl(null);
        console.log(`[Evite] Form cleared after deleting active event`);
      }
      
      toast({ 
        title: "Event deleted", 
        description: "Event and associated images have been permanently removed from the database." 
      });
    } catch (error) {
      console.error("[Evite] Failed to delete event:", error);
      
      // Reload events to get accurate state
      try {
        const reloadedEvents = await loadEvents();
        setEvents(reloadedEvents);
        if (reloadedEvents.length > 0 && !reloadedEvents.find(e => e.id === activeEventId)) {
          setActiveEventId(reloadedEvents[0].id);
        } else if (reloadedEvents.length === 0) {
          setActiveEventId(null);
        }
      } catch (reloadError) {
        console.error("[Evite] Failed to reload events:", reloadError);
      }
      
      toast({ 
        title: "Failed to delete event", 
        description: error instanceof Error ? error.message : "Please try again or refresh the page.",
        variant: "destructive" 
      });
    }
  };

  const addGuest = async () => {
    if (!activeEvent) return;
    if (!newGuest.name || !newGuest.email) {
      toast({ title: "Enter guest name and email", variant: "destructive" });
      return;
    }
    const updated: EviteEvent = {
      ...activeEvent,
      guests: [
        ...activeEvent.guests,
        { 
          id: String(Date.now()), 
          name: newGuest.name, 
          email: newGuest.email, 
          phone: newGuest.phone || undefined,
          status: "pending" 
        },
      ],
    };
    const next = events.map((e) => (e.id === activeEvent.id ? updated : e));
    setEvents(next);
    // Save to Supabase
    await saveEvent(updated);
    setNewGuest({ name: "", email: "", phone: "" });
  };

  const removeGuest = async (guestId: string) => {
    if (!activeEvent) return;
    const updated: EviteEvent = { ...activeEvent, guests: activeEvent.guests.filter((g) => g.id !== guestId) };
    const next = events.map((e) => (e.id === activeEvent.id ? updated : e));
    setEvents(next);
    // Save to Supabase
    await saveEvent(updated);
  };

  const setGuestStatus = async (guestId: string, status: GuestStatus) => {
    if (!activeEvent) return;
    const updated: EviteEvent = {
      ...activeEvent,
      guests: activeEvent.guests.map((g) => (g.id === guestId ? { ...g, status } : g)),
    };
    const next = events.map((e) => (e.id === activeEvent.id ? updated : e));
    setEvents(next);
    // Save to Supabase
    await saveEvent(updated);
  };

  const copyInviteLink = async () => {
    if (!activeEvent) return;
    const url = `${window.location.origin}/evite/${activeEvent.id}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied", description: url });
  };

  const sendInvites = async () => {
    if (!activeEvent) return;
    if (activeEvent.guests.length === 0) {
      toast({
        title: "No guests to invite",
        description: "Add at least one guest before sending invites.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Reload the event from storage to ensure we have the latest data including custom images
      // This is a quick operation (usually < 100ms)
      const latestEvent = await loadEvent(activeEvent.id);
      const eventToSend = latestEvent || activeEvent;
      
      console.log("Calling send-evites function with event:", {
        id: eventToSend.id,
        title: eventToSend.title,
        useCustomImages: eventToSend.useCustomImages,
        customImages: eventToSend.customImages,
        customImagesCount: eventToSend.customImages?.length || 0,
        customStyle: eventToSend.customStyle,
        guestsCount: eventToSend.guests.length,
        firstImageUrl: eventToSend.customImages?.[0],
        firstImageUrlType: typeof eventToSend.customImages?.[0],
        isGhibliImage: eventToSend.customImages?.[0]?.includes('replicate') || eventToSend.customImages?.[0]?.includes('transform'),
      });
      
      const { data, error } = await supabase.functions.invoke("send-evites", {
        body: { 
          event: eventToSend, 
          origin: window.location.origin,
          isUpdate: false // Manual send is not an update
        },
      });
      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      console.log("Function response:", data);
      const sent = data?.sent ?? 0;
      const failed = data?.failed || [];
      const failedCount = failed.length;
      
      // Separate email and SMS results
      const allResults = data?.results || [];
      const emailResults = allResults.filter((f: any) => !f.type || f.type === "email");
      const smsResults = allResults.filter((f: any) => f.type === "sms");
      const emailSent = emailResults.filter((r: any) => r.ok).length;
      const emailFailed = emailResults.filter((r: any) => !r.ok).length;
      const smsSent = smsResults.filter((r: any) => r.ok).length;
      const smsFailed = smsResults.filter((r: any) => !r.ok).length;
      
      // Extract error messages for better debugging
      const errorMessages = failed.map((f: any) => f.error || "Unknown error").join("; ");
      
      let description = "";
      if (emailSent > 0 && smsSent > 0) {
        description = `${emailSent} email${emailSent === 1 ? "" : "s"} and ${smsSent} SMS sent.`;
      } else if (emailSent > 0) {
        description = `${emailSent} email${emailSent === 1 ? "" : "s"} sent.`;
      } else if (smsSent > 0) {
        description = `${smsSent} SMS sent.`;
      }
      
      if (failedCount > 0) {
        console.error("Failed details:", failed);
        const failedDetails = [];
        if (emailFailed > 0) failedDetails.push(`${emailFailed} email${emailFailed === 1 ? "" : "s"}`);
        if (smsFailed > 0) failedDetails.push(`${smsFailed} SMS`);
        
        toast({
          title: sent > 0 ? `Sent ${sent} invite${sent === 1 ? "" : "s"}, ${failedCount} failed` : `Failed to send ${failedCount} invite${failedCount === 1 ? "" : "s"}`,
          description: failedDetails.length > 0 
            ? `${description} ${failedDetails.join(" and ")} failed. Check configuration.`
            : errorMessages.length > 100 
            ? `${errorMessages.substring(0, 100)}... Check console for details.` 
            : errorMessages || "Check SMTP/SMS configuration in Supabase Dashboard → Functions → Secrets.",
          variant: failedCount > 0 && sent === 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: `Sent ${sent} invite${sent === 1 ? "" : "s"}`,
          description: description || "Invites dispatched.",
        });
      }
    } catch (e: any) {
      console.error("Error sending invites:", e);
      const errorMsg = e?.message || e?.error?.message || String(e);
      toast({
        title: "Failed to send emails",
        description: errorMsg.includes("Function not found") || errorMsg.includes("404")
          ? "Function not deployed. Deploy 'send-evites' in Supabase Dashboard → Edge Functions."
          : errorMsg.includes("Failed to fetch") || errorMsg.includes("Network")
          ? "Network error. Check your Supabase URL in .env.local and ensure function is deployed."
          : errorMsg || "Check SMTP settings and function deployment.",
        variant: "destructive",
      });
    }
  };

  const accepted = activeEvent?.guests.filter((g) => g.status === "accepted").length ?? 0;
  const declined = activeEvent?.guests.filter((g) => g.status === "declined").length ?? 0;
  const pending = activeEvent?.guests.filter((g) => g.status === "pending").length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header with Authentication */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto" key={`auth-${user?.id || 'no-user'}`}>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.email}</span>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowLogin(true)} 
              variant="outline"
              size="sm"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        )}
      </div>
      
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            Party67 E‑Vite
          </h1>
          <p className="text-muted-foreground mt-2">
            Create invitations, manage guests, track RSVPs, and share a public invite link.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Events */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {authLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in to view and manage your events.</p>
                  <Button onClick={() => setShowLogin(true)} className="w-full" size="sm">
                    Sign In
                  </Button>
                </div>
              ) : loading ? (
                <p className="text-sm text-muted-foreground">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet. Create your first event below.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-2">{events.length} event{events.length === 1 ? '' : 's'}</p>
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                  <button
                    className={`text-left flex-1 ${activeEventId === event.id ? "font-semibold" : ""}`}
                    onClick={() => setActiveEventId(event.id)}
                  >
                    <div className="truncate">{event.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {event.date} • {event.time}
                    </div>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Main */}
          <div className="lg:col-span-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="create">
                  <Calendar className="w-4 h-4 mr-2" /> Create
                </TabsTrigger>
                <TabsTrigger value="guests" disabled={!activeEvent}>
                  <Users className="w-4 h-4 mr-2" /> Guests
                </TabsTrigger>
                <TabsTrigger value="rsvps" disabled={!activeEvent}>
                  <ClipboardCheck className="w-4 h-4 mr-2" /> RSVPs
                </TabsTrigger>
                <TabsTrigger value="share" disabled={!activeEvent}>
                  <Mail className="w-4 h-4 mr-2" /> Share & Remind
                </TabsTrigger>
              </TabsList>

              {/* Create */}
              <TabsContent value="create" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Event title</Label>
                        <Input
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          placeholder="Sophia’s 6th Birthday"
                        />
                      </div>
                      <div>
                        <Label>Host name</Label>
                        <Input
                          value={draft.hostName}
                          onChange={(e) => setDraft({ ...draft, hostName: e.target.value })}
                          placeholder="Hosted by Emily"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={draft.date}
                          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={draft.time}
                          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <AddressAutocomplete
                        label="Location"
                        value={draft.location}
                        onChange={(address) => {
                          console.log("[Evite] Location changed to:", address);
                          setDraft((prev) => ({ ...prev, location: address }));
                        }}
                        placeholder="Start typing an address (e.g., 10731...)"
                        required
                      />
                    </div>
                    <div>
                      <Label>Message to guests</Label>
                      <Textarea
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        placeholder="We can’t wait to celebrate with you! Costumes encouraged."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Template</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            className={`p-3 border rounded-xl text-left hover:border-primary transition ${
                              draft.template === t.id ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                            onClick={() => setDraft({ ...draft, template: t.id })}
                          >
                            <div className="flex items-center gap-2">
                              <Palette className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{t.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Theme preset</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Custom photos for AI-styled invite */}
                    <div className="border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <Label className="mb-2">Customize invite with my photos</Label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={customizeEnabled}
                            onChange={(e) => setCustomizeEnabled(e.target.checked)}
                          />
                          <span>Enable</span>
                        </label>
                      </div>
                      {customizeEnabled && (
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label>Style</Label>
                              <select
                                className="w-full border rounded-md h-10 px-3"
                                value={customStyle}
                                onChange={(e) => setCustomStyle(e.target.value as any)}
                              >
                                <option value="classic">Classic</option>
                                <option value="elegant">Elegant</option>
                                <option value="kids">Kids</option>
                                <option value="minimal">Minimal</option>
                              </select>
                            </div>
                            <div>
                              <Label>Upload photo (1 photo will be transformed to Ghibli art style)</Label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCustomFiles([file]);
                                  } else {
                                    setCustomFiles([]);
                                  }
                                }}
                                className="block w-full text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Your photo will be transformed into Studio Ghibli art style with "Welcome to the party" text.
                              </p>
                            </div>
                          </div>
                          {customFiles.length > 0 && (
                            <div className="mt-3">
                              <div className="aspect-video border rounded-lg overflow-hidden max-w-md relative">
                                <img 
                                  src={URL.createObjectURL(customFiles[0])} 
                                  className="w-full h-full object-contain" 
                                  alt="Preview" 
                                  style={{ objectPosition: 'center' }}
                                />
                                </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Click "Transform & Preview" to see Ghibli art style transformation
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                className="mt-2"
                                onClick={async () => {
                                  // Upload and transform to show preview
                                  const file = customFiles[0];
                                  setIsUploading(true);
                                  try {
                                    const timestamp = Date.now();
                                    const path = `evite-uploads/preview_${timestamp}_${file.name}`;
                                    
                                    const { data: up, error: upErr } = await (supabase as any).storage.from("evite-uploads").upload(path, file, {
                                      cacheControl: "3600",
                                      upsert: false,
                                    });
                                    
                                    if (upErr) {
                                      toast({
                                        title: "Upload failed",
                                        description: "Could not upload image for preview",
                                        variant: "destructive",
                                      });
                                      setIsUploading(false);
                                      return;
                                    }
                                    
                                    const { data: pub } = (supabase as any).storage.from("evite-uploads").getPublicUrl(up.path);
                                    if (!pub?.publicUrl) {
                                      toast({
                                        title: "Preview failed",
                                        description: "Could not get image URL",
                                        variant: "destructive",
                                      });
                                      setIsUploading(false);
                                      return;
                                    }
                                    
                                    setOriginalImageUrl(pub.publicUrl);
                                    
                                    // Transform image
                                    toast({
                                      title: "Transforming...",
                                      description: "Converting to Ghibli art style",
                                    });
                                    
                                    const { data: transformData, error: transformError } = await supabase.functions.invoke("transform-image", {
                                      body: {
                                        imageUrl: pub.publicUrl,
                                        eventTitle: draft.title || "Event"
                                      },
                                    });
                                    
                                    if (transformError) {
                                      console.error("[Evite] Transform error:", transformError);
                                      toast({
                                        title: "Transformation failed",
                                        description: transformError.message || "Check console for details. Make sure REPLICATE_API_TOKEN is set.",
                                        variant: "destructive",
                                        duration: 10000,
                                      });
                                      setTransformedImageUrl(pub.publicUrl);
                                    } else if (!transformData?.transformedImageUrl) {
                                      console.warn("[Evite] No transformed image URL in response:", transformData);
                                      toast({
                                        title: "Transformation incomplete",
                                        description: "No transformed image returned. Check if REPLICATE_API_TOKEN is set in Supabase secrets.",
                                        variant: "destructive",
                                        duration: 10000,
                                      });
                                      setTransformedImageUrl(pub.publicUrl);
                                    } else if (transformData.transformedImageUrl === pub.publicUrl) {
                                      console.warn("[Evite] Transformed URL same as original - transformation may have failed");
                                      toast({
                                        title: "Transformation may have failed",
                                        description: "The transformed image appears to be the same as the original. Check Supabase logs.",
                                        variant: "default",
                                        duration: 8000,
                                      });
                                      setTransformedImageUrl(transformData.transformedImageUrl);
                                    } else {
                                      console.log("[Evite] ✓ Transformation successful:", transformData.transformedImageUrl);
                                      setTransformedImageUrl(transformData.transformedImageUrl);
                                    }
                                    
                                    setShowTransformPreview(true);
                                  } catch (err) {
                                    console.error("Preview error:", err);
                                    toast({
                                      title: "Preview error",
                                      description: "Could not generate preview",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                                disabled={isUploading}
                              >
                                {isUploading ? "Transforming..." : "Transform & Preview"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={createEvent} 
                        className="flex-1" 
                        disabled={isUploading || !user}
                        title={!user ? "Please sign in to create events" : ""}
                      >
                        {!user ? "Sign In to Create" : activeEvent ? "Update Event" : "Create Event"}
                      </Button>
                      {activeEvent && (
                        <Button variant="outline" className="flex-1" onClick={() => navigate(`/evite/${activeEvent.id}`)}>
                          Preview Public Invite
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Guests */}
              <TabsContent value="guests" className="mt-4">
                {!activeEvent ? (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground">Create an event first</CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Guest List</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Guest name"
                            value={newGuest.name}
                            onChange={(e) => setNewGuest((g) => ({ ...g, name: e.target.value }))}
                          />
                          <Input
                            placeholder="Email address"
                            type="email"
                            value={newGuest.email}
                            onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))}
                          />
                          <Input
                            placeholder="Phone (optional, for SMS)"
                            type="tel"
                            value={newGuest.phone}
                            onChange={(e) => setNewGuest((g) => ({ ...g, phone: e.target.value }))}
                          />
                          <Button onClick={addGuest}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Add phone number to send SMS invites</p>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeEvent.guests.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell>{g.name}</TableCell>
                              <TableCell className="truncate">{g.email}</TableCell>
                              <TableCell className="truncate">{g.phone || "-"}</TableCell>
                              <TableCell className="capitalize">{g.status}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setGuestStatus(g.id, "accepted")}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setGuestStatus(g.id, "declined")}>
                                    Decline
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setGuestStatus(g.id, "pending")}>
                                    Reset
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => removeGuest(g.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {activeEvent.guests.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No guests yet. Add your first guest above.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      <div className="flex items-center justify-end pt-2">
                        <Button
                          onClick={() => {
                            if (!activeEvent || activeEvent.guests.length === 0) {
                              toast({
                                title: "Add at least one guest",
                                description: "Please add guests before submitting your e‑vite.",
                                variant: "destructive",
                              });
                              return;
                            }
                            sendInvites();
                            setTab("share");
                          }}
                          className="px-6"
                          disabled={!activeEvent || activeEvent.guests.length === 0}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Submit & Send E‑Vite
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* RSVPs */}
              <TabsContent value="rsvps" className="mt-4">
                {!activeEvent ? (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground">Create an event first</CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Accepted</CardTitle>
                        </CardHeader>
                        <CardContent className="text-4xl font-bold text-green-600">{accepted}</CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Declined</CardTitle>
                        </CardHeader>
                        <CardContent className="text-4xl font-bold text-red-600">{declined}</CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Pending</CardTitle>
                        </CardHeader>
                        <CardContent className="text-4xl font-bold text-yellow-600">{pending}</CardContent>
                      </Card>
                    </div>

                    {/* Accepted Guests Details */}
                    {accepted > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Accepted RSVPs - Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {activeEvent.guests
                              .filter((g) => g.status === "accepted")
                              .map((guest) => (
                                <div key={guest.id} className="border rounded-lg p-4 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-lg">{guest.name}</h4>
                                      <p className="text-sm text-muted-foreground">{guest.email}</p>
                                      {guest.phone && (
                                        <p className="text-sm text-muted-foreground">📱 {guest.phone}</p>
                                      )}
                                    </div>
                                  </div>

                                  {guest.numberOfAttendees && (
                                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Food Preference</p>
                                        <p className="text-base capitalize">
                                          {guest.foodPreference === "veg"
                                            ? "Vegetarian"
                                            : guest.foodPreference === "non-veg"
                                            ? "Non-Vegetarian"
                                            : "Both"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                                        <p className="text-base">
                                          {guest.numberOfAttendees} {guest.numberOfAttendees === 1 ? "person" : "people"}
                                        </p>
                                      </div>
                                      {guest.numberOfAdults && (
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground">Adults</p>
                                          <p className="text-base">{guest.numberOfAdults}</p>
                                        </div>
                                      )}
                                      {guest.numberOfKids !== undefined && guest.numberOfKids > 0 && (
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground">Kids</p>
                                          <p className="text-base">{guest.numberOfKids}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {guest.kids && guest.kids.length > 0 && (
                                    <div className="pt-2 border-t">
                                      <p className="text-sm font-medium text-muted-foreground mb-2">Kids Details</p>
                                      <div className="space-y-1">
                                        {guest.kids.map((kid, idx) => (
                                          <p key={idx} className="text-sm">
                                            • {kid.name} ({kid.age} {kid.age === 1 ? "year" : "years"} old)
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {guest.dietaryPreferences && (
                                    <div className="pt-2 border-t">
                                      <p className="text-sm font-medium text-muted-foreground">Dietary Preferences</p>
                                      <p className="text-sm">{guest.dietaryPreferences}</p>
                                    </div>
                                  )}

                                  {guest.note && (
                                    <div className="pt-2 border-t">
                                      <p className="text-sm font-medium text-muted-foreground">Note</p>
                                      <p className="text-sm">{guest.note}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Share */}
              <TabsContent value="share" className="mt-4">
                {!activeEvent ? (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground">Create an event first</CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Share & Remind</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input readOnly value={`${window.location.origin}/evite/${activeEvent.id}`} />
                        <Button onClick={copyInviteLink}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={sendInvites}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send invites
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/evite/${activeEvent.id}`)}>
                          Preview Public Invite
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Sends emails via SMTP. Guests with phone numbers will also receive SMS.
                        </p>
                        {activeEvent.guests.filter(g => g.phone).length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <MessageSquare className="w-4 h-4" />
                            <span>{activeEvent.guests.filter(g => g.phone).length} guest{activeEvent.guests.filter(g => g.phone).length === 1 ? "" : "s"} will receive SMS</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Transform Preview Dialog */}
      <Dialog open={showTransformPreview} onOpenChange={setShowTransformPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: Ghibli Art Style Transformation</DialogTitle>
            <DialogDescription>
              This is how your invite will look with the Ghibli art style transformation. Approve to use this image, or deny to send invites without any image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {transformedImageUrl && (
              <div className="space-y-2">
                <Label>Transformed Image (Ghibli Style)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={transformedImageUrl} 
                    alt="Ghibli transformed preview" 
                    className="w-full h-auto object-contain max-h-[500px]"
                    style={{ objectPosition: 'center' }}
                  />
                </div>
              </div>
            )}
            
            {originalImageUrl && (
              <div className="space-y-2">
                <Label>Original Image (for comparison)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={originalImageUrl} 
                    alt="Original preview" 
                    className="w-full h-auto object-contain max-h-[300px]"
                    style={{ objectPosition: 'center' }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImageApproved(false);
                setShowTransformPreview(false);
                toast({
                  title: "Image denied",
                  description: "Invites will be sent without images",
                });
              }}
            >
              Deny - Send Without Image
            </Button>
            <Button
              onClick={() => {
                setImageApproved(true);
                setShowTransformPreview(false);
                toast({
                  title: "Image approved",
                  description: "This Ghibli art style image will be used in invites",
                });
              }}
            >
              Approve - Use This Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Login Screen */}
      {showLogin && <LoginScreen onClose={() => setShowLogin(false)} />}
    </div>
  );
}


