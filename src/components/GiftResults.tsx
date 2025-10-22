import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, ArrowLeft, ShoppingCart, Gift, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RecommendationResponse } from "@/pages/Index";

interface GiftResultsProps {
  results: RecommendationResponse;
  onBack: () => void;
}

export const GiftResults = ({ results, onBack }: GiftResultsProps) => {
  const [quantity, setQuantity] = useState(results.quantity || 1);
  const { toast } = useToast();

  const totalCost = (results.pricePerBag || 0) * quantity;

  const handleCheckout = () => {
    toast({
      title: "Checkout",
      description: `Proceeding to checkout for ${quantity} bags at $${totalCost.toFixed(2)}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
            Your Perfect Gift Recommendations
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-generated visuals and curated selections for your event
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Start Over
          </Button>
        </div>

        {/* Pricing and Quantity Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="quantity" className="text-lg font-semibold">Number of Bags</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-2 text-lg p-6 rounded-xl"
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm text-muted-foreground">Price per bag</p>
                <p className="text-3xl font-bold text-primary">${results.pricePerBag?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full mt-6 py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
            >
              <ShoppingCart className="mr-2 w-5 h-5" />
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>

        {/* Gift Recommendations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary" />
            Return Gift Ideas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.recommendations.map((gift, index) => (
              <Card 
                key={index} 
                className="overflow-hidden rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 border-border animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {gift.imageUrl && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img 
                      src={gift.imageUrl} 
                      alt={gift.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {gift.category}
                    </span>
                    <span className="text-lg font-bold text-primary">{gift.price}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{gift.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{gift.description}</p>
                  
                  <Button 
                    asChild
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <a href={gift.buyLink} target="_blank" rel="noopener noreferrer">
                      View on Amazon
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bag Recommendations */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-accent" />
            Perfect Gift Bags
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.bags.map((bag, index) => (
              <Card 
                key={index} 
                className="overflow-hidden rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 border-border animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${(results.recommendations.length + index) * 100}ms` }}
              >
                {bag.imageUrl && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img 
                      src={bag.imageUrl} 
                      alt={bag.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                      Gift Bag
                    </span>
                    <span className="text-lg font-bold text-accent">{bag.price}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{bag.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{bag.description}</p>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full rounded-xl border-accent text-accent hover:bg-accent hover:text-white"
                  >
                    <a href={bag.buyLink} target="_blank" rel="noopener noreferrer">
                      View on Amazon
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
