import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, UserCheck } from "lucide-react";
import { loadEvent, saveEvent, type EviteEvent, type Guest } from "@/utils/eviteStorage";

type GuestStatus = "pending" | "accepted" | "declined";

export default function EviteInvite() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EviteEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        const loadedEvent = await loadEvent(eventId);
        setEvent(loadedEvent);
      } catch (error) {
        console.error("Failed to load event:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const [form, setForm] = useState({ name: "", email: "", response: "accepted" as GuestStatus, note: "" });

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

  const submitRSVP = async () => {
    if (!event) return;
    if (!form.name || !form.email) {
      toast({ title: "Enter your name and email", variant: "destructive" });
      return;
    }
    // upsert guest by email
    const idx = event.guests.findIndex((g) => g.email.toLowerCase() === form.email.toLowerCase());
    let updated: EviteEvent;
    if (idx >= 0) {
      const copy = [...event.guests];
      copy[idx] = { ...copy[idx], name: form.name, status: form.response };
      updated = { ...event, guests: copy };
    } else {
      updated = {
        ...event,
        guests: [
          ...event.guests,
          { id: String(Date.now()), name: form.name, email: form.email, status: form.response },
        ],
      };
    }
    setEvent(updated);
    await saveEvent(updated);
    toast({
      title: "RSVP received",
      description: `Thanks! Your response is ${form.response}.`,
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
          <div className={`h-40 bg-gradient-to-r ${headerGradient}`} />
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
                onValueChange={(v) => setForm({ ...form, response: v as GuestStatus })}
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


