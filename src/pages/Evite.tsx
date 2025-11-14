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
import { Calendar, Copy, Mail, Plus, Trash2, Users, ClipboardCheck, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEvents, saveEvents, saveEvent, type EviteEvent, type Guest } from "@/utils/eviteStorage";
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
        const loadedEvents = await loadEvents();
        setEvents(loadedEvents);
        if (loadedEvents.length > 0 && !activeEventId) {
          setActiveEventId(loadedEvents[0].id);
        }
      } catch (error) {
        console.error("Failed to load events:", error);
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

  const [newGuest, setNewGuest] = useState({ name: "", email: "" });

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) ?? null,
    [events, activeEventId]
  );

  useEffect(() => {
    if (!loading && events.length > 0) {
      saveEvents(events);
    }
  }, [events, loading]);

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
      createdAt: Date.now(),
    };
    const next = [newEvent, ...events];
    setEvents(next);
    setActiveEventId(id);
    // Save to Supabase
    await saveEvent(newEvent);
    toast({ title: "Event created", description: "Share your invite link with guests." });
  };

  const deleteEvent = (id: string) => {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    if (activeEventId === id) setActiveEventId(next[0]?.id ?? null);
    toast({ title: "Event deleted" });
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
        { id: String(Date.now()), name: newGuest.name, email: newGuest.email, status: "pending" },
      ],
    };
    const next = events.map((e) => (e.id === activeEvent.id ? updated : e));
    setEvents(next);
    // Save to Supabase
    await saveEvent(updated);
    setNewGuest({ name: "", email: "" });
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
      console.log("Calling send-evites function with event:", activeEvent);
      const { data, error } = await supabase.functions.invoke("send-evites", {
        body: { event: activeEvent, origin: window.location.origin },
      });
      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      console.log("Function response:", data);
      const sent = data?.sent ?? 0;
      const failed = data?.failed || [];
      const failedCount = failed.length;
      
      // Extract error messages for better debugging
      const errorMessages = failed.map((f: any) => f.error || "Unknown error").join("; ");
      
      if (failedCount > 0) {
        console.error("Failed email details:", failed);
        toast({
          title: sent > 0 ? `Sent ${sent} invite${sent === 1 ? "" : "s"}, ${failedCount} failed` : `Failed to send ${failedCount} invite${failedCount === 1 ? "" : "s"}`,
          description: errorMessages.length > 100 
            ? `${errorMessages.substring(0, 100)}... Check console for details.` 
            : errorMessages || "Check SMTP configuration in Supabase Dashboard → Functions → Secrets.",
          variant: failedCount > 0 && sent === 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: `Sent ${sent} invite${sent === 1 ? "" : "s"}`,
          description: "Emails dispatched via SMTP.",
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
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet</p>}
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
                        onChange={(address) => setDraft({ ...draft, location: address })}
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
                    <div className="flex gap-3">
                      <Button onClick={createEvent} className="flex-1">
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
                        <Button onClick={addGuest}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeEvent.guests.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell>{g.name}</TableCell>
                              <TableCell className="truncate">{g.email}</TableCell>
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
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground">Uses SMTP settings from your environment.</p>
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


