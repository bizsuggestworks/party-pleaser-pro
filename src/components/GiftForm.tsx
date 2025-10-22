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
    nationality: "",
    kids: [] as Array<{ age: string; gender: string }>,
    theme: "",
    bagSize: "",
  });

  const [themeOptions, setThemeOptions] = useState<string[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);

  const handleNext = async () => {
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
    if (step === 4) {
      if (!formData.nationality || formData.kids.length === 0) {
        toast({ title: "Please add at least one kid with nationality", variant: "destructive" });
        return;
      }
      // Generate theme options based on demographics
      setLoadingThemes(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-gift-recommendations", {
          body: { 
            action: "generate-themes",
            nationality: formData.nationality,
            kids: formData.kids
          },
        });
        if (error) throw error;
        setThemeOptions(data.themes || []);
      } catch (error) {
        console.error("Error generating themes:", error);
        toast({ title: "Error generating themes", variant: "destructive" });
      } finally {
        setLoadingThemes(false);
      }
    }
    if (step === 5 && !formData.theme) {
      toast({ title: "Please select a theme", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const addKid = () => {
    setFormData({ ...formData, kids: [...formData.kids, { age: "", gender: "" }] });
  };

  const updateKid = (index: number, field: "age" | "gender", value: string) => {
    const newKids = [...formData.kids];
    newKids[index][field] = value;
    setFormData({ ...formData, kids: newKids });
  };

  const removeKid = (index: number) => {
    const newKids = formData.kids.filter((_, i) => i !== index);
    setFormData({ ...formData, kids: newKids });
  };

  const handleSubmit = async () => {
    if (!formData.bagSize) {
      toast({ title: "Please select a bag size", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gift-recommendations", {
        body: { 
          action: "generate-recommendations",
          ...formData,
          quantity: formData.kids.length
        },
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
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full mx-1 transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Step {step} of 6
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
                Tell us about the kids
              </h2>
              <p className="text-muted-foreground">Add details for each kid attending</p>
            </div>
            <div>
              <Label htmlFor="nationality" className="text-lg">Nationality</Label>
              <Input
                id="nationality"
                type="text"
                placeholder="e.g., American, Indian, British"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="mt-2 text-lg p-6 rounded-xl"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-lg">Kids Information</Label>
              {formData.kids.map((kid, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Age"
                      value={kid.age}
                      onChange={(e) => updateKid(index, "age", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <RadioGroup value={kid.gender} onValueChange={(v) => updateKid(index, "gender", v)}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="boy" id={`boy-${index}`} />
                          <Label htmlFor={`boy-${index}`}>Boy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="girl" id={`girl-${index}`} />
                          <Label htmlFor={`girl-${index}`}>Girl</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeKid(index)}
                    className="rounded-xl"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addKid}
                className="w-full rounded-xl"
              >
                Add Kid
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Select a Theme
              </h2>
              <p className="text-muted-foreground">Choose from personalized theme suggestions</p>
            </div>
            {loadingThemes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Generating themes...</p>
              </div>
            ) : (
              <RadioGroup value={formData.theme} onValueChange={(v) => setFormData({ ...formData, theme: v })}>
                {themeOptions.map((theme) => (
                  <div key={theme} className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem value={theme} id={theme} />
                    <Label htmlFor={theme} className="cursor-pointer flex-1 text-lg">{theme}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Choose Bag Size
              </h2>
              <p className="text-muted-foreground">Select the perfect size for your gifts</p>
            </div>
            <RadioGroup value={formData.bagSize} onValueChange={(v) => setFormData({ ...formData, bagSize: v })}>
              {["Small (6-8 items)", "Medium (9-12 items)", "Large (13+ items)"].map((size) => (
                <div key={size} className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value={size} id={size} />
                  <Label htmlFor={size} className="cursor-pointer flex-1 text-lg">{size}</Label>
                </div>
              ))}
            </RadioGroup>
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
          {step < 6 ? (
            <Button
              onClick={handleNext}
              disabled={loadingThemes}
              className="flex-1 py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
            >
              {loadingThemes ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
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
