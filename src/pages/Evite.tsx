import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Copy, Mail, Plus, Trash2, Users, ClipboardCheck, Palette, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEvents, loadEvent, saveEvents, saveEvent, deleteEvent as deleteEventFromStorage, type EviteEvent, type Guest } from "@/utils/eviteStorage";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

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
  const [tab, setTab] = useState("create");

  const [events, setEvents] = useState<EviteEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load events from Supabase on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        console.log("[Evite] Loading events...");
        const loadedEvents = await loadEvents();
        console.log(`[Evite] Loaded ${loadedEvents.length} events:`, loadedEvents.map(e => ({ id: e.id, title: e.title, hasImages: !!e.customImages?.length })));
        setEvents(loadedEvents);
        if (loadedEvents.length > 0 && !activeEventId) {
          setActiveEventId(loadedEvents[0].id);
          console.log(`[Evite] Set active event to: ${loadedEvents[0].id}`);
        }
      } catch (error) {
        console.error("[Evite] Failed to load events:", error);
        // Try to load from localStorage as fallback
        try {
          const raw = localStorage.getItem("partyify-evite-events");
          if (raw) {
            const localEvents = JSON.parse(raw);
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
  }, []);

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

  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "" });

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) ?? null,
    [events, activeEventId]
  );

  // Note: We don't auto-save all events on every change anymore
  // Individual operations (create, update, delete) handle their own persistence

  const createEvent = async () => {
    if (!draft.title || !draft.date || !draft.time || !draft.location) {
      toast({
        title: "Missing details",
        description: "Please fill in title, date, time, and location.",
        variant: "destructive",
      });
      return;
    }
    const id = String(Date.now());
    const newEvent: EviteEvent = {
      id,
      ...draft,
      guests: [],
      useCustomImages: customizeEnabled,
      customStyle: customizeEnabled ? customStyle : undefined,
      customImages: [],
      createdAt: Date.now(),
    };
    
    // Add to local state first for immediate UI update
    const next = [newEvent, ...events];
    setEvents(next);
    setActiveEventId(id);
    
    // Save to Supabase
    try {
      // If customization enabled and files selected, upload and update event
      if (customizeEnabled && customFiles.length > 0) {
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
        
        for (const [index, file] of customFiles.entries()) {
          const timestamp = Date.now();
          const path = `evite-uploads/${id}/${timestamp}_${index}_${file.name}`;
          console.log(`[Evite] Uploading file ${index + 1}/${customFiles.length}:`);
          console.log(`[Evite]   Name: ${file.name}`);
          console.log(`[Evite]   Size: ${(file.size / 1024).toFixed(2)} KB`);
          console.log(`[Evite]   Type: ${file.type}`);
          console.log(`[Evite]   Target path: ${path}`);
          
          try {
            const { data: up, error: upErr } = await (supabase as any).storage.from("evite-uploads").upload(path, file, {
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
              continue;
            }
            
            if (!up || !up.path) {
              console.error(`[Evite] Upload succeeded but no data returned. Response:`, up);
              toast({ 
                title: "Upload incomplete", 
                description: "File uploaded but could not get file path. Check console for details.",
                variant: "destructive",
                duration: 10000
              });
              continue;
            }
            
            console.log(`[Evite] ✓ Upload response:`, up);
            console.log(`[Evite]   File path: ${up.path}`);
            
            // Get public URL
            const { data: pub } = (supabase as any).storage.from("evite-uploads").getPublicUrl(up.path);
            console.log(`[Evite] Public URL response:`, pub);
            
            if (pub?.publicUrl) {
              uploadedUrls.push(pub.publicUrl);
              console.log(`[Evite] ✓✓✓ File uploaded successfully! ✓✓✓`);
              console.log(`[Evite]   Public URL: ${pub.publicUrl}`);
              
              // Verify the URL is accessible
              try {
                const testResponse = await fetch(pub.publicUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                  console.log(`[Evite] ✓ URL is accessible (status: ${testResponse.status})`);
                } else {
                  console.warn(`[Evite] ⚠ URL returned status ${testResponse.status} - may not be public`);
                }
              } catch (fetchErr) {
                console.warn(`[Evite] ⚠ Could not verify URL accessibility:`, fetchErr);
              }
            } else {
              console.error(`[Evite] ✗ Failed to get public URL for uploaded file`);
              console.error(`[Evite]   Upload data:`, up);
              console.error(`[Evite]   Public URL data:`, pub);
              toast({ 
                title: "URL generation failed", 
                description: "File uploaded but could not generate public URL. Check console for details.",
                variant: "destructive",
                duration: 10000
              });
            }
          } catch (uploadException) {
            console.error(`[Evite] Exception during upload:`, uploadException);
            toast({ 
              title: "Upload exception", 
              description: uploadException instanceof Error ? uploadException.message : String(uploadException),
              variant: "destructive",
              duration: 10000
            });
          }
        }
        
        console.log(`[Evite] All files uploaded. Total URLs: ${uploadedUrls.length}`, uploadedUrls);
        const updatedEvent: EviteEvent = { ...newEvent, customImages: uploadedUrls };
        await saveEvent(updatedEvent);
        
        // Update local state with images
        setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
        console.log(`[Evite] Event ${id} saved with ${uploadedUrls.length} custom images`);
      } else {
        await saveEvent(newEvent);
        console.log(`[Evite] Event ${id} saved without custom images`);
      }
      
      // Reload events to ensure consistency
      const reloadedEvents = await loadEvents();
      setEvents(reloadedEvents);
      console.log(`[Evite] Reloaded ${reloadedEvents.length} events after creation`);
    } finally {
      setIsUploading(false);
    }
    toast({ title: "Event created", description: "Share your invite link with guests." });
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
      // Delete from Supabase and localStorage
      await deleteEventFromStorage(id);
      console.log(`[Evite] ✓ Storage deletion completed for event ${id}`);
      
      toast({ 
        title: "Event deleted", 
        description: "Event has been permanently removed." 
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
      });
      
      const { data, error } = await supabase.functions.invoke("send-evites", {
        body: { event: eventToSend, origin: window.location.origin },
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
              {loading ? (
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
                              <Label>Upload photos (up to 3)</Label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []).slice(0, 3);
                                  setCustomFiles(files);
                                }}
                                className="block w-full text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Best results with wide (16:9) images. Large, clear photos recommended.
                              </p>
                            </div>
                          </div>
                          {customFiles.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {customFiles.map((f, i) => (
                                <div key={i} className="aspect-video border rounded-lg overflow-hidden">
                                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={createEvent} className="flex-1" disabled={isUploading}>
                        Create Event
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
    </div>
  );
}


