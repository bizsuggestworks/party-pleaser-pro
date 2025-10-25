import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, X } from "lucide-react";

export const DevModeIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }
  
  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-white"
        size="sm"
      >
        <Settings className="w-4 h-4" />
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-yellow-50 border-yellow-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-yellow-800">Development Mode</h3>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• Stripe disabled (no tracking warnings)</p>
          <p>• PayPal uses mock flow</p>
          <p>• Google Pay is simulated</p>
          <p>• All payments are test transactions</p>
        </div>
      </CardContent>
    </Card>
  );
};
