import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, UserCheck } from "lucide-react";
import { loadEvent, saveEvent, type EviteEvent, type Guest, type Kid } from "@/utils/eviteStorage";

type GuestStatus = "pending" | "accepted" | "declined";

export default function EviteInvite() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EviteEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        console.error("[EviteInvite] No eventId provided");
        setLoading(false);
        return;
      }
      console.log(`[EviteInvite] Loading event with ID: ${eventId}`);
      try {
        const loadedEvent = await loadEvent(eventId);
        if (loadedEvent) {
          console.log(`[EviteInvite] Event loaded successfully:`, loadedEvent.title);
          setEvent(loadedEvent);
        } else {
          console.error(`[EviteInvite] Event ${eventId} not found`);
          setEvent(null);
        }
      } catch (error) {
        console.error("[EviteInvite] Failed to load event:", error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    response: "accepted" as GuestStatus,
    foodPreference: "both" as "veg" | "non-veg" | "both",
    numberOfAttendees: 1,
    numberOfAdults: 1,
    numberOfKids: 0,
    kids: [] as Kid[],
    dietaryPreferences: "",
    note: "",
  });

  const headerGradient = useMemo(() => {
    switch (event?.template) {
      case "elegant":
        return "from-rose-200 to-pink-300";
      case "kids":
        return "from-yellow-200 to-orange-300";
      case "minimal":
        return "from-slate-200 to-zinc-300";
      case "classic":
      default:
        return "from-purple-200 to-pink-300";
    }
  }, [event?.template]);

  const updateKid = (index: number, field: keyof Kid, value: string | number) => {
    const updatedKids = [...form.kids];
    updatedKids[index] = { ...updatedKids[index], [field]: value };
    setForm({ ...form, kids: updatedKids });
  };

  const submitRSVP = async () => {
    if (!event) return;
    if (!form.name || !form.email) {
      toast({ title: "Enter your name and email", variant: "destructive" });
      return;
    }

    // Validate kids count matches
    if (form.response === "accepted" && form.numberOfKids > 0 && form.kids.length !== form.numberOfKids) {
      toast({
        title: "Kids information incomplete",
        description: `Please provide details for all ${form.numberOfKids} kid(s).`,
        variant: "destructive",
      });
      return;
    }

    // Validate kids have names and ages
    if (form.response === "accepted" && form.kids.some((k) => !k.name || k.age <= 0)) {
      toast({
        title: "Kids information incomplete",
        description: "Please provide name and age for all kids.",
        variant: "destructive",
      });
      return;
    }

    // Prepare guest data
    const guestData: Guest = {
      id: String(Date.now()),
      name: form.name,
      email: form.email,
      status: form.response,
    };

    // Only include RSVP details if accepted
    if (form.response === "accepted") {
      guestData.foodPreference = form.foodPreference;
      guestData.numberOfAttendees = form.numberOfAttendees;
      guestData.numberOfAdults = form.numberOfAdults;
      guestData.numberOfKids = form.numberOfKids;
      if (form.numberOfKids > 0) {
        guestData.kids = form.kids;
      }
      if (form.dietaryPreferences) {
        guestData.dietaryPreferences = form.dietaryPreferences;
      }
      if (form.note) {
        guestData.note = form.note;
      }
    }

    // upsert guest by email
    const idx = event.guests.findIndex((g) => g.email.toLowerCase() === form.email.toLowerCase());
    let updated: EviteEvent;
    if (idx >= 0) {
      const copy = [...event.guests];
      copy[idx] = { ...copy[idx], ...guestData };
      updated = { ...event, guests: copy };
    } else {
      updated = {
        ...event,
        guests: [...event.guests, guestData],
      };
    }

    setEvent(updated);
    await saveEvent(updated);
    toast({
      title: "RSVP received",
      description: `Thanks! Your response is ${form.response === "accepted" ? "accepted" : "declined"}.`,
    });

    // Reset form
    setForm({
      name: "",
      email: "",
      response: "accepted",
      foodPreference: "both",
      numberOfAttendees: 1,
      numberOfAdults: 1,
      numberOfKids: 0,
      kids: [],
      dietaryPreferences: "",
      note: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">This invite link is invalid or the event was removed.</p>
          <p className="text-sm text-muted-foreground">Please contact the event host for a new invitation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Invitation card */}
        <Card className="overflow-hidden">
          {event.useCustomImages && event.customImages && event.customImages.length > 0 ? (
            <div className="h-40 w-full overflow-hidden">
              <img src={event.customImages[0]} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`h-40 bg-gradient-to-r ${headerGradient}`} />
          )}
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center text-center md:text-left">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{event.date}</span>
                <span>•</span>
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{event.location}</span>
              </div>
            </div>
            <p className="text-center text-muted-foreground">{event.description}</p>
            <p className="text-center text-sm">Hosted by {event.hostName || "your host"}</p>
          </CardContent>
        </Card>

        {/* RSVP card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> RSVP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Response</Label>
              <RadioGroup
                value={form.response}
                onValueChange={(v) => {
                  const newResponse = v as GuestStatus;
                  setForm({
                    ...form,
                    response: newResponse,
                    // Reset counts if declining
                    ...(newResponse === "declined" ? { numberOfAttendees: 1, numberOfAdults: 1, numberOfKids: 0, kids: [] } : {}),
                  });
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accepted" id="accepted" />
                  <Label htmlFor="accepted">Accept</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="declined" id="declined" />
                  <Label htmlFor="declined">Decline</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Show additional fields only if accepting */}
            {form.response === "accepted" && (
              <>
                <div>
                  <Label className="mb-2 block">Food Preference</Label>
                  <Select
                    value={form.foodPreference}
                    onValueChange={(v) => setForm({ ...form, foodPreference: v as "veg" | "non-veg" | "both" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Attendees</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.numberOfAttendees}
                      onChange={(e) => {
                        const total = parseInt(e.target.value) || 1;
                        setForm({
                          ...form,
                          numberOfAttendees: total,
                          // Auto-calculate adults if kids change
                          numberOfAdults: Math.max(1, total - form.numberOfKids),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Adults</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.numberOfAdults}
                      onChange={(e) => {
                        const adults = parseInt(e.target.value) || 1;
                        const kids = form.numberOfAttendees - adults;
                        setForm({
                          ...form,
                          numberOfAdults: adults,
                          numberOfKids: Math.max(0, kids),
                          kids: form.kids.slice(0, Math.max(0, kids)),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Kids</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.numberOfKids}
                      onChange={(e) => {
                        const kids = parseInt(e.target.value) || 0;
                        const adults = form.numberOfAttendees - kids;
                        // Auto-populate kids array
                        let updatedKids = [...form.kids];
                        if (kids > updatedKids.length) {
                          // Add empty kid entries
                          updatedKids = [...updatedKids, ...Array(kids - updatedKids.length).fill(null).map(() => ({ name: "", age: 0 }))];
                        } else if (kids < updatedKids.length) {
                          // Remove extra entries
                          updatedKids = updatedKids.slice(0, kids);
                        }
                        setForm({
                          ...form,
                          numberOfKids: kids,
                          numberOfAdults: Math.max(1, adults),
                          kids: updatedKids,
                        });
                      }}
                    />
                  </div>
                </div>

                {form.numberOfKids > 0 && (
                  <div className="space-y-3">
                    <Label>Kids Details</Label>
                    {form.kids.map((kid, index) => (
                      <div key={index} className="grid md:grid-cols-2 gap-2 items-end p-3 border rounded-lg">
                        <div>
                          <Label>Kid {index + 1} Name</Label>
                          <Input
                            placeholder="Kid's name"
                            value={kid.name}
                            onChange={(e) => updateKid(index, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Age</Label>
                          <Input
                            type="number"
                            min="0"
                            max="18"
                            placeholder="Age"
                            value={kid.age || ""}
                            onChange={(e) => updateKid(index, "age", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label>Dietary Preferences / Allergies</Label>
                  <Textarea
                    rows={2}
                    placeholder="Any dietary restrictions, allergies, or special requirements..."
                    value={form.dietaryPreferences}
                    onChange={(e) => setForm({ ...form, dietaryPreferences: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Note (optional)</Label>
              <Textarea
                rows={3}
                placeholder="Add a note for the host"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <Button onClick={submitRSVP} className="w-full">
              Submit RSVP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


