import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/GiftForm";
import { GiftResults } from "@/components/GiftResults";
import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Sparkles, Heart, User, LogOut, Settings } from "lucide-react";

export interface GiftItem {
  title: string;
  description: string;
  price: number;
  category: string;
  buyLink: string;
  imageUrl?: string;
}

export interface BagWithContents {
  bagTitle: string;
  bagDescription: string;
  bagPrice: number;
  bagBuyLink: string;
  bagImageUrl?: string;
  items: GiftItem[];
  totalItemsCost: number;
  totalBagCost: number;
}

export interface RecommendationResponse {
  bags: BagWithContents[];
  quantity: number;
  pricePerBag: number;
  totalCost: number;
}

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const { user, signOut, isAdmin } = useAuth();

  const handleFormComplete = (data: RecommendationResponse) => {
    setResults(data);
  };

  const handleReset = () => {
    setShowForm(false);
    setResults(null);
  };

  if (results) {
    return <GiftResults results={results} onBack={handleReset} />;
  }

  if (showForm) {
    return <GiftForm onComplete={handleFormComplete} />;
  }

  if (showLogin) {
    return <LoginScreen onClose={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header with Authentication */}
      <div className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            {isAdmin && (
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                size="sm"
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
          <Button onClick={() => setShowLogin(true)} variant="outline">
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Gift className="w-16 h-16 text-primary" />
              <Sparkles className="w-12 h-12 text-accent animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent pb-2">
              Party Pleaser Pro
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Perfect return gift recommendations for any event, budget, and theme
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="p-6 rounded-2xl bg-card shadow-card border border-border hover:shadow-glow transition-all duration-300">
              <Gift className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Event-Specific</h3>
              <p className="text-sm text-muted-foreground">
                Tailored suggestions for birthdays, weddings, and more
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card shadow-card border border-border hover:shadow-glow transition-all duration-300">
              <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Theme-Based</h3>
              <p className="text-sm text-muted-foreground">
                LEGO, Minecraft, K-pop, and trending themes
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card shadow-card border border-border hover:shadow-glow transition-all duration-300">
              <Heart className="w-10 h-10 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Budget-Friendly</h3>
              <p className="text-sm text-muted-foreground">
                Get perfect gifts within your price range
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setShowForm(true)}
            size="lg"
            className="text-lg px-8 py-6 rounded-full shadow-glow hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent"
          >
            Find Perfect Gifts
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
