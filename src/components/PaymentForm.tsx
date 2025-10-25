import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Loader2, CheckCircle, AlertCircle, Smartphone, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
// Google Pay will be implemented with a custom button
import { PAYPAL_CONFIG } from "@/config/paypal";
import { STRIPE_CONFIG } from "@/config/stripe";

interface PaymentFormProps {
  totalAmount: number;
  quantity: number;
  personalization: {
    customNames: string[];
    customMessage: string;
    printNames: boolean;
    specialInstructions: string;
  };
  giftSelections?: {
    eventType?: string;
    theme?: string;
    budget?: string;
    bagSize?: string;
    kids?: Array<{name: string, age: number}>;
    bags?: Array<{
      bagTitle: string;
      bagDescription: string;
      items: Array<{
        title: string;
        description: string;
        category: string;
        imageUrl?: string;
      }>;
    }>;
  };
  onPaymentSuccess: (orderId: string) => void;
  onCancel: () => void;
}

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// Stripe Card Component
const StripeCardForm = ({ 
  customerInfo, 
  totalAmount, 
  quantity, 
  personalization, 
  onPaymentSuccess, 
  onError 
}: {
  customerInfo: any;
  totalAmount: number;
  quantity: number;
  personalization: any;
  onPaymentSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent (in real app, this would call your backend)
      const { error, paymentIntent } = await stripe.confirmCardPayment("pi_mock_client_secret", {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zipCode,
            },
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        const orderId = `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Save order to localStorage for admin dashboard
        const order = {
          id: orderId,
          customerName: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          totalAmount: totalAmount,
          quantity: quantity,
          status: 'pending' as const,
          personalization: personalization,
          giftSelections: giftSelections,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentMethod: 'card',
          address: customerInfo.address,
          stripePaymentIntentId: paymentIntent.id
        };

        // Get existing orders and add new one
        const existingOrders = JSON.parse(localStorage.getItem('party-pleaser-orders') || '[]');
        existingOrders.push(order);
        localStorage.setItem('party-pleaser-orders', JSON.stringify(existingOrders));

        onPaymentSuccess(orderId);
      }
    } catch (error) {
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="card-element">Card Details</Label>
        <div className="mt-2 p-3 border border-input rounded-md">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${totalAmount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
};

export const PaymentForm = ({ 
  totalAmount, 
  quantity, 
  personalization, 
  giftSelections,
  onPaymentSuccess, 
  onCancel 
}: PaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'gpay'>('card');
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const { toast } = useToast();

  // Google Pay is implemented as a mock button for now

  const handleGooglePaySuccess = (paymentData: any) => {
    const orderId = `gpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
        // Save order to localStorage for admin dashboard
        const order = {
          id: orderId,
          customerName: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          totalAmount: totalAmount,
          quantity: quantity,
          status: 'pending' as const,
          personalization: personalization,
          giftSelections: giftSelections,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentMethod: 'gpay',
          address: customerInfo.address,
          googlePayData: paymentData
        };

    // Get existing orders and add new one
    const existingOrders = JSON.parse(localStorage.getItem('party-pleaser-orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('party-pleaser-orders', JSON.stringify(existingOrders));

    console.log('Google Pay payment successful:', { 
      orderId, 
      paymentData,
      totalAmount, 
      quantity, 
      personalization, 
      customerInfo 
    });
    
    setPaymentStatus('success');
    onPaymentSuccess(orderId);
  };

  const handlePayPalSuccess = (paypalOrderId: string) => {
    const orderId = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save order to localStorage for admin dashboard
    const order = {
      id: orderId,
      customerName: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      totalAmount: totalAmount,
      quantity: quantity,
      status: 'pending' as const,
      personalization: personalization,
      giftSelections: giftSelections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'paypal',
      address: customerInfo.address,
      paypalOrderId: paypalOrderId
    };

    // Get existing orders and add new one
    const existingOrders = JSON.parse(localStorage.getItem('party-pleaser-orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('party-pleaser-orders', JSON.stringify(existingOrders));

    console.log('PayPal payment successful:', { 
      orderId, 
      paypalOrderId,
      totalAmount, 
      quantity, 
      personalization, 
      customerInfo 
    });
    
    setPaymentStatus('success');
    onPaymentSuccess(orderId);
  };

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      });
      return;
    }

    // Card validation is now handled by Stripe Elements

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing based on method
      let orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (paymentMethod === 'card') {
        // Simulate card validation
        if (cardInfo.cardNumber.length < 16) {
          throw new Error('Invalid card number. Please enter a valid 16-digit card number.');
        }
        if (cardInfo.cvv.length < 3) {
          throw new Error('Invalid CVV. Please enter a valid 3-4 digit CVV.');
        }
        if (!cardInfo.expiryDate.includes('/')) {
          throw new Error('Invalid expiry date. Please use MM/YY format.');
        }
        orderId = `card_${orderId}`;
      } else if (paymentMethod === 'paypal') {
        orderId = `paypal_${orderId}`;
        // Simulate PayPal redirect
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else if (paymentMethod === 'gpay') {
        orderId = `gpay_${orderId}`;
        // Simulate Google Pay processing
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save order to localStorage for admin dashboard
      const order = {
        id: orderId,
        customerName: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        totalAmount: totalAmount,
        quantity: quantity,
        status: 'pending' as const,
        personalization: personalization,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        address: customerInfo.address
      };

      // Get existing orders and add new one
      const existingOrders = JSON.parse(localStorage.getItem('party-pleaser-orders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('party-pleaser-orders', JSON.stringify(existingOrders));

      console.log('Payment successful:', { 
        orderId, 
        totalAmount, 
        quantity, 
        personalization, 
        paymentMethod,
        customerInfo 
      });
      
      setPaymentStatus('success');
      onPaymentSuccess(orderId);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your order has been placed. You'll receive a confirmation email shortly.
          </p>
          <Button onClick={() => window.location.href = '/'} className="w-full">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Number of gift bags:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per bag:</span>
              <span className="font-semibold">${(totalAmount / quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {personalization.printNames && personalization.customNames.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Custom Names:</p>
              <p className="text-sm text-muted-foreground">{personalization.customNames.join(', ')}</p>
            </div>
          )}
          
          {personalization.customMessage && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Special Message:</p>
              <p className="text-sm text-muted-foreground">"{personalization.customMessage}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={customerInfo.city}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={customerInfo.state}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={customerInfo.zipCode}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="ZIP Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'paypal' | 'gpay')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">
                <CreditCard className="w-4 h-4 mr-2" />
                Credit Card
              </TabsTrigger>
              <TabsTrigger value="paypal">
                <DollarSign className="w-4 h-4 mr-2" />
                PayPal
              </TabsTrigger>
              <TabsTrigger value="gpay">
                <Smartphone className="w-4 h-4 mr-2" />
                Google Pay
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="space-y-4">
              <Elements stripe={stripePromise} options={STRIPE_CONFIG.elementsOptions}>
                <StripeCardForm
                  customerInfo={customerInfo}
                  totalAmount={totalAmount}
                  quantity={quantity}
                  personalization={personalization}
                  onPaymentSuccess={onPaymentSuccess}
                  onError={(error) => {
                    toast({
                      title: "Payment Failed",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </Elements>
            </TabsContent>
            
            <TabsContent value="paypal" className="text-center py-8">
              <div className="space-y-4">
                <DollarSign className="w-16 h-16 mx-auto text-blue-600" />
                <h3 className="text-lg font-semibold">Pay with PayPal</h3>
                <p className="text-muted-foreground">
                  Complete your payment securely with PayPal.
                </p>
                
        {PAYPAL_CONFIG.clientId === "mock_paypal_client_id" ? (
          // Mock PayPal implementation for development
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Using mock PayPal integration. 
                In production, configure a real PayPal client ID.
              </p>
            </div>
            <Button
              onClick={() => {
                // Validate amount before processing
                if (totalAmount <= 0) {
                  toast({
                    title: "Invalid Amount",
                    description: "Please enter a valid amount for your order.",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Simulate PayPal processing
                setIsProcessing(true);
                setTimeout(() => {
                  const mockPayPalOrderId = 'mock_paypal_order_' + Date.now();
                  handlePayPalSuccess(mockPayPalOrderId);
                }, 2000);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing PayPal Payment...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pay with PayPal (Mock)
                </>
              )}
            </Button>
          </div>
        ) : (
                  // Real PayPal implementation for production
                  <PayPalScriptProvider 
                    options={{ 
                      "client-id": PAYPAL_CONFIG.clientId,
                      currency: PAYPAL_CONFIG.currency,
                      intent: PAYPAL_CONFIG.intent,
                      "enable-funding": "venmo,paylater",
                      "disable-funding": "",
                      "data-sdk-integration-source": "integrationbuilder_ac",
                      components: "buttons",
                      debug: true // Enable debug mode for development
                    }}
                  >
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        // Validate amount before creating order
                        if (totalAmount <= 0) {
                          throw new Error('Invalid amount for PayPal order');
                        }
                        
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                value: totalAmount.toFixed(2), // Ensure proper decimal formatting
                                currency_code: "USD"
                              },
                              description: `${quantity} Gift Bag${quantity > 1 ? 's' : ''} - Party Pleaser Pro`,
                              custom_id: `order_${Date.now()}` // Add custom ID for tracking
                            }
                          ],
                          application_context: {
                            brand_name: "Party Pleaser Pro",
                            landing_page: "NO_PREFERENCE",
                            user_action: "PAY_NOW"
                          }
                        });
                      }}
                      onApprove={(data, actions) => {
                        if (!actions.order) {
                          throw new Error('PayPal order actions not available');
                        }
                        
                        return actions.order.capture().then((details) => {
                          console.log('PayPal payment approved:', details);
                          handlePayPalSuccess(details.id);
                        }).catch((error) => {
                          console.error('PayPal capture error:', error);
                          toast({
                            title: "Payment Capture Failed",
                            description: "There was an issue capturing your PayPal payment. Please try again.",
                            variant: "destructive",
                          });
                        });
                      }}
                      onError={(err) => {
                        console.error('PayPal error:', err);
                        let errorMessage = "There was an issue with your PayPal payment. Please try again.";
                        
                        // Handle specific error cases
                        if (err.message?.includes('422')) {
                          errorMessage = "Invalid payment amount or configuration. Please check your order details.";
                        } else if (err.message?.includes('400')) {
                          errorMessage = "Invalid request. Please refresh the page and try again.";
                        } else if (err.message?.includes('500')) {
                          errorMessage = "PayPal service is temporarily unavailable. Please try again later.";
                        }
                        
                        toast({
                          title: "PayPal Payment Failed",
                          description: errorMessage,
                          variant: "destructive",
                        });
                      }}
                      onCancel={(data) => {
                        console.log('PayPal payment cancelled:', data);
                        toast({
                          title: "Payment Cancelled",
                          description: "You cancelled the PayPal payment. You can try again or use a different payment method.",
                        });
                      }}
                      style={PAYPAL_CONFIG.buttonStyle}
                    />
                  </PayPalScriptProvider>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="gpay" className="text-center py-8">
              <div className="space-y-4">
                <Smartphone className="w-16 h-16 mx-auto text-green-600" />
                <h3 className="text-lg font-semibold">Pay with Google Pay</h3>
                <p className="text-muted-foreground">
                  Use your Google Pay account for a quick and secure payment.
                </p>
                
                <Button 
                  onClick={() => {
                    // Simulate Google Pay processing
                    setIsProcessing(true);
                    setTimeout(() => {
                      const mockPaymentData = {
                        paymentMethodData: {
                          description: 'Google Pay Payment',
                          tokenizationData: {
                            token: 'mock_google_pay_token_' + Date.now()
                          }
                        }
                      };
                      handleGooglePaySuccess(mockPaymentData);
                    }, 2000);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay with Google Pay
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="flex gap-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isProcessing}
        >
          Back to Order
        </Button>
      </div>

      {paymentStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>Payment failed. Please try again.</span>
        </div>
      )}
    </div>
  );
};
