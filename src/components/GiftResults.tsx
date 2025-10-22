import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, RotateCcw, Gift } from "lucide-react";
import type { GiftRecommendation } from "@/pages/Index";

interface GiftResultsProps {
  recommendations: GiftRecommendation[];
  onReset: () => void;
}

export const GiftResults = ({ recommendations, onReset }: GiftResultsProps) => {
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
            We've curated these gifts based on your preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {recommendations.map((gift, index) => (
            <Card 
              key={index} 
              className="p-6 rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 border-border animate-in fade-in slide-in-from-bottom duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
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
                  View Product
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 text-lg border-2"
          >
            <RotateCcw className="mr-2 w-5 h-5" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};
