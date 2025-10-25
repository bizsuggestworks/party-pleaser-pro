import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Package, Clock } from "lucide-react";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // In a real app, you would fetch order details from your backend
    if (orderId) {
      console.log('Order ID:', orderId);
      // Simulate fetching order details
      setOrderDetails({
        orderId,
        totalAmount: 25.99,
        quantity: 2,
        status: 'confirmed',
        estimatedDelivery: '3-5 business days'
      });
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Your order has been confirmed and is being prepared.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {orderDetails && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Order Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-xs">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">${orderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of Bags:</span>
                    <span>{orderDetails.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Confirmation Email</p>
                    <p className="text-xs text-muted-foreground">Sent to your email</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Package className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Order Status</p>
                    <p className="text-xs text-muted-foreground">Being prepared</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Estimated Delivery</p>
                  <p className="text-xs text-muted-foreground">{orderDetails.estimatedDelivery}</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send you updates about your order via email. 
              You can also contact us if you have any questions.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Order Another Gift Bag
              </Button>
              <Button 
                onClick={() => window.print()}
                className="flex-1"
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
