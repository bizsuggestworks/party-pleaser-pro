import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, ArrowLeft, ShoppingCart, Gift, ShoppingBag, Package, List, CreditCard, User, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/PaymentForm";
import type { RecommendationResponse } from "@/pages/Index";

interface GiftResultsProps {
  results: RecommendationResponse;
  onBack: () => void;
}

export const GiftResults = ({ results, onBack }: GiftResultsProps) => {
  const [quantity, setQuantity] = useState(results.quantity || 1);
  const [selectedBagIndex, setSelectedBagIndex] = useState(0); // Track which bag is selected
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [personalization, setPersonalization] = useState({
    customNames: [] as string[],
    customMessage: "",
    printNames: false,
    specialInstructions: ""
  });
  const { toast } = useToast();

  const totalCost = (results.pricePerBag || 0) * quantity;

  const handlePaymentSuccess = (orderId: string) => {
    // Redirect to payment success page
    window.location.href = `/payment-success?orderId=${orderId}`;
  };

  const handleStartPayment = () => {
    setShowPayment(true);
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
  };

  // Show payment form if user clicked to pay
  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
        <div className="container mx-auto px-4 py-12">
          <PaymentForm
            totalAmount={totalCost}
            quantity={quantity}
            personalization={personalization}
            giftSelections={{
              eventType: "Birthday Party", // This would come from the form data
              theme: results.bags[selectedBagIndex]?.items[0]?.category || "General",
              budget: "Within Budget",
              bagSize: "Medium",
              kids: [], // This would come from the form data
              bags: [results.bags[selectedBagIndex]] // Only pass the selected bag
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handleCancelPayment}
          />
        </div>
      </div>
    );
  }

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

        {/* Order Summary Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="quantity" className="text-lg font-semibold">Number of Gift Bags</Label>
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
                <p className="text-sm text-muted-foreground">Budget per bag</p>
                <p className="text-3xl font-bold text-primary">Within Budget</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Within Budget
                </p>
              </div>
            </div>
            
            {/* Personalization Options */}
            <div className="mt-8 space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="printNames"
                  checked={personalization.printNames}
                  onCheckedChange={(checked) => 
                    setPersonalization(prev => ({ ...prev, printNames: checked as boolean }))
                  }
                />
                <Label htmlFor="printNames" className="text-lg font-semibold">
                  <User className="w-5 h-5 inline mr-2" />
                  Print custom names on items
                </Label>
              </div>
              
              {personalization.printNames && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customNames" className="text-sm font-medium">
                      Enter names (one per line):
                    </Label>
                    <Textarea
                      id="customNames"
                      placeholder="Enter names, one per line..."
                      value={personalization.customNames.join('\n')}
                      onChange={(e) => setPersonalization(prev => ({ 
                        ...prev, 
                        customNames: e.target.value.split('\n').filter(name => name.trim())
                      }))}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="customMessage" className="text-sm font-medium">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Special message for the bags:
                </Label>
                <Textarea
                  id="customMessage"
                  placeholder="e.g., 'Thank you for celebrating with us!' or 'Happy Birthday!'"
                  value={personalization.customMessage}
                  onChange={(e) => setPersonalization(prev => ({ 
                    ...prev, 
                    customMessage: e.target.value 
                  }))}
                  className="mt-2"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="specialInstructions" className="text-sm font-medium">
                  Special instructions for gift preparation:
                </Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="Any specific requirements, allergies, or preferences..."
                  value={personalization.specialInstructions}
                  onChange={(e) => setPersonalization(prev => ({ 
                    ...prev, 
                    specialInstructions: e.target.value 
                  }))}
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleStartPayment}
              className="w-full mt-6 py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
            >
              <CreditCard className="mr-2 w-5 h-5" />
              Place Order & Pay
            </Button>
          </CardContent>
        </Card>

        {/* Bag Options */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Complete Gift Bag Options
          </h2>
          <p className="text-muted-foreground mb-6">Click on a bag to select it. Each bag includes all items shown below and stays within your budget</p>
          
          {/* Selected Bag Indicator */}
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-primary">Selected: {results.bags[selectedBagIndex]?.bagTitle}</p>
                <p className="text-sm text-muted-foreground">{results.bags[selectedBagIndex]?.bagDescription}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.bags.map((bag, bagIndex) => (
              <Card 
                key={bagIndex} 
                className={`overflow-hidden rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 border-2 cursor-pointer ${
                  selectedBagIndex === bagIndex 
                    ? 'border-primary bg-primary/5 shadow-glow' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedBagIndex(bagIndex)}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{bag.bagTitle}</h3>
                        {selectedBagIndex === bagIndex && (
                          <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{bag.bagDescription}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary flex-shrink-0" />
                  </div>

                  {/* Bag Info */}
                  <div className="mb-4 p-3 bg-accent/10 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Gift Bag:</span>
                      <span className="text-lg font-bold text-accent">Premium Quality</span>
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
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Included
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {item.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  We'll source this for you
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bag Summary */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items included:</span>
                      <span className="font-semibold">{bag.items.length} quality items</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gift bag:</span>
                      <span className="font-semibold">Premium quality</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Budget per bag:</span>
                      <span className="text-primary">Within your budget</span>
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
                            <span className="font-medium text-green-600">✓ Included</span>
                          </li>
                        ))}
                        <li className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">• {bag.bagTitle} (Bag)</span>
                          <span className="font-medium text-green-600">✓ Included</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-semibold">Budget per bag:</span>
                      <span className="text-xl font-bold text-primary">Within your budget</span>
                    </div>

                    {quantity > 1 && (
                      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                        <span>× {quantity} bags</span>
                        <span className="font-semibold text-green-600">All within budget</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Order Summary ({quantity} bags):</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Within Budget
                    </span>
                  </div>
                  <Button 
                    className="w-full py-6 rounded-xl text-lg bg-gradient-to-r from-primary to-accent"
                    onClick={() => {
                      toast({
                        title: "Checkout Complete!",
                        description: `Processing ${quantity} bag${quantity > 1 ? 's' : ''} within your budget`,
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
