import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, ArrowLeft, ShoppingCart, Gift, ShoppingBag, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { RecommendationResponse } from "@/pages/Index";

interface GiftResultsProps {
  results: RecommendationResponse;
  onBack: () => void;
}

export const GiftResults = ({ results, onBack }: GiftResultsProps) => {
  const [quantity, setQuantity] = useState(results.quantity || 1);
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();

  const totalCost = (results.pricePerBag || 0) * quantity;

  const handleCheckout = () => {
    setShowCheckout(true);
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

        {/* Bag Options */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Complete Gift Bag Options
          </h2>
          <p className="text-muted-foreground mb-6">Each bag includes all items shown below and stays within your ${results.pricePerBag.toFixed(2)} budget</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.bags.map((bag, bagIndex) => (
              <Card 
                key={bagIndex} 
                className="overflow-hidden rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 border-border"
              >
                {/* Bag Header */}
                {bag.bagImageUrl && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img 
                      src={bag.bagImageUrl} 
                      alt={bag.bagTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{bag.bagTitle}</h3>
                      <p className="text-sm text-muted-foreground">{bag.bagDescription}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary flex-shrink-0" />
                  </div>

                  {/* Bag Price */}
                  <div className="mb-4 p-3 bg-accent/10 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Bag Cost:</span>
                      <span className="text-lg font-bold text-accent">${bag.bagPrice.toFixed(2)}</span>
                    </div>
                    <Button 
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-accent"
                    >
                      <a href={bag.bagBuyLink} target="_blank" rel="noopener noreferrer">
                        View Bag on Amazon <ExternalLink className="ml-1 w-3 h-3" />
                      </a>
                    </Button>
                  </div>

                  {/* Items in Bag */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" />
                      Items in This Bag ({bag.items.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bag.items.map((item, itemIndex) => (
                        <div 
                          key={itemIndex}
                          className="border border-border rounded-xl p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            {item.imageUrl && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h5 className="font-semibold text-sm leading-tight">{item.title}</h5>
                                <span className="text-sm font-bold text-primary whitespace-nowrap">${item.price.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {item.category}
                                </span>
                                <a 
                                  href={item.buyLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-accent hover:underline flex items-center gap-1"
                                >
                                  Amazon <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items Total:</span>
                      <span className="font-semibold">${bag.totalItemsCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bag Cost:</span>
                      <span className="font-semibold">${bag.bagPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total per Bag:</span>
                      <span className="text-primary">${bag.totalBagCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Checkout Modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Order Summary</DialogTitle>
              <DialogDescription>
                Review your {quantity} gift bag{quantity > 1 ? 's' : ''} before checkout
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {results.bags.map((bag, bagIndex) => (
                <Card key={bagIndex} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <ShoppingBag className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-bold text-lg">{bag.bagTitle}</h3>
                        <p className="text-sm text-muted-foreground">Option {bagIndex + 1}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold">Contains {bag.items.length} items:</h4>
                      <ul className="space-y-1.5 ml-4">
                        {bag.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">• {item.title}</span>
                            <span className="font-medium">${item.price.toFixed(2)}</span>
                          </li>
                        ))}
                        <li className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">• {bag.bagTitle} (Bag)</span>
                          <span className="font-medium">${bag.bagPrice.toFixed(2)}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-semibold">Total per bag:</span>
                      <span className="text-xl font-bold text-primary">${bag.totalBagCost.toFixed(2)}</span>
                    </div>

                    {quantity > 1 && (
                      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                        <span>× {quantity} bags</span>
                        <span className="font-semibold">${(bag.totalBagCost * quantity).toFixed(2)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Grand Total ({quantity} bags):</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                  <Button 
                    className="w-full py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
                    onClick={() => {
                      toast({
                        title: "Checkout Complete!",
                        description: `Processing ${quantity} bag${quantity > 1 ? 's' : ''} for $${totalCost.toFixed(2)}`,
                      });
                      setShowCheckout(false);
                    }}
                  >
                    <ShoppingCart className="mr-2 w-5 h-5" />
                    Complete Purchase
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
