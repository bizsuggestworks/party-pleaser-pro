import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import type { RecommendationResponse } from "@/pages/Index";

interface GiftFormProps {
  onComplete: (results: RecommendationResponse) => void;
}

export const GiftForm = ({ onComplete }: GiftFormProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    eventType: "",
    budget: "",
    requirement: "",
    theme: "",
    bagPreference: "",
  });

  const handleNext = () => {
    if (step === 1 && !formData.eventType) {
      toast({ title: "Please select an event type", variant: "destructive" });
      return;
    }
    if (step === 2 && !formData.budget) {
      toast({ title: "Please enter your budget", variant: "destructive" });
      return;
    }
    if (step === 3 && !formData.requirement) {
      toast({ title: "Please select a requirement type", variant: "destructive" });
      return;
    }
    if (step === 4 && !formData.theme) {
      toast({ title: "Please describe your theme preferences", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!formData.bagPreference) {
      toast({ title: "Please describe your bag preferences", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gift-recommendations", {
        body: formData,
      });

      if (error) throw error;

      onComplete(data);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-glow p-8 md:p-12 border border-border">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full mx-1 transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Step {step} of 5
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                What's your event?
              </h2>
              <p className="text-muted-foreground">Choose the occasion for these return gifts</p>
            </div>
            <RadioGroup value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
              {["Birthday Party", "Wedding", "Baby Shower", "Corporate Event", "Other"].map((event) => (
                <div key={event} className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value={event} id={event} />
                  <Label htmlFor={event} className="cursor-pointer flex-1 text-lg">{event}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                What's your budget?
              </h2>
              <p className="text-muted-foreground">Enter your budget per gift in your currency</p>
            </div>
            <div>
              <Label htmlFor="budget" className="text-lg">Budget per gift</Label>
              <Input
                id="budget"
                type="text"
                placeholder="e.g., $10-20 or ₹500-1000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="mt-2 text-lg p-6 rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Customized or Generic?
              </h2>
              <p className="text-muted-foreground">Choose your preference</p>
            </div>
            <RadioGroup value={formData.requirement} onValueChange={(v) => setFormData({ ...formData, requirement: v })}>
              {[
                { value: "customized", label: "Customized", desc: "Personalized gifts with names or custom designs" },
                { value: "generic", label: "Generic", desc: "Ready-to-buy popular items" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-start space-x-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                  <div className="flex-1 cursor-pointer">
                    <Label htmlFor={opt.value} className="text-lg font-semibold cursor-pointer">{opt.label}</Label>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Any specific themes?
              </h2>
              <p className="text-muted-foreground">Tell us about the theme or interests (e.g., LEGO, Minecraft, K-pop)</p>
            </div>
            <div>
              <Label htmlFor="theme" className="text-lg">Theme or Interests</Label>
              <Textarea
                id="theme"
                placeholder="e.g., Kids love LEGO and Minecraft, girls prefer K-pop themed items..."
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="mt-2 min-h-32 text-lg p-4 rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gift Bag Preferences
              </h2>
              <p className="text-muted-foreground">What should the gift bag look like?</p>
            </div>
            <div>
              <Label htmlFor="bagPreference" className="text-lg">Bag Style & Design</Label>
              <Textarea
                id="bagPreference"
                placeholder="e.g., Colorful paper bags with cartoon characters, fabric pouches with the event theme, eco-friendly kraft bags..."
                value={formData.bagPreference}
                onChange={(e) => setFormData({ ...formData, bagPreference: e.target.value })}
                className="mt-2 min-h-32 text-lg p-4 rounded-xl"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="flex-1 py-6 rounded-xl text-lg"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={handleNext}
              className="flex-1 py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
            >
              Next
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  Get Recommendations
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
