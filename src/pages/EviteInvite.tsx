import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, UserCheck } from "lucide-react";

type GuestStatus = "pending" | "accepted" | "declined";

interface Guest {
  id: string;
  name: string;
  email: string;
  status: GuestStatus;
}

interface EviteEvent {
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

function loadEvent(id: string): EviteEvent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    return list.find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}

function saveEvent(updated: EviteEvent) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as EviteEvent[]) : [];
    const next = list.map((e) => (e.id === updated.id ? updated : e));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function EviteInvite() {
  const { eventId } = useParams();
  const { toast } = useToast();

  const [event, setEvent] = useState<EviteEvent | null>(() =>
    eventId ? loadEvent(eventId) : null
  );

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

  const submitRSVP = () => {
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
    saveEvent(updated);
    toast({
      title: "RSVP received",
      description: `Thanks! Your response is ${form.response}.`,
    });
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">This invite link is invalid or the event was removed.</p>
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


