import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/GiftForm";
import { GiftResults } from "@/components/GiftResults";
import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Sparkles, Heart, User, LogOut, Settings, Star, Users, Award, Zap, ArrowRight, Play, CheckCircle } from "lucide-react";

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
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user, signOut, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  // cleaned up debug logs

  // Force re-render when auth state changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [user, isAdmin]);

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
    console.log('Showing login screen');
    return <LoginScreen onClose={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Debug UI removed */}
      
      {/* Temporary Admin Link for Testing - Remove in production */}
      {/* {user && isAdmin && (
        <div style={{position: 'fixed', top: '10px', left: '10px', background: 'yellow', padding: '10px', zIndex: 9999}}>
          <a href="/admin" style={{color: 'black', textDecoration: 'none'}}>Direct Admin Link</a>
        </div>
      )} */}
      
      {/* Header with Authentication */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto" key={`auth-${user?.id || 'no-user'}`}>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            {isAdmin && (
              <Button
                onClick={() => {
                  console.log('Admin Dashboard button clicked');
                  console.log('Current location:', window.location.pathname);
                  console.log('Navigating to /admin');
                  try {
                    navigate('/admin');
                    console.log('Navigation called successfully');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                console.log('Sign in button clicked');
                console.log('Current showLogin state:', showLogin);
                setShowLogin(true);
                console.log('Set showLogin to true');
              }} 
              variant="outline"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        )}
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gift Images */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-4 gap-4 h-full">
            <div className="bg-gradient-to-br from-pink-200 to-purple-300 rounded-2xl m-2"></div>
            <div className="bg-gradient-to-br from-blue-200 to-cyan-300 rounded-2xl m-2"></div>
            <div className="bg-gradient-to-br from-yellow-200 to-orange-300 rounded-2xl m-2"></div>
            <div className="bg-gradient-to-br from-green-200 to-emerald-300 rounded-2xl m-2"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center space-y-8">
            {/* Logo and Brand */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="relative">
                  <Gift className="w-20 h-20 text-purple-600 animate-bounce" />
                  <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>
                 <div className="text-left">
                   <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                     Giftify
                   </h1>
                   <p className="text-lg text-gray-600 font-medium">Where Every Gift Tells a Story</p>
                 </div>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-gray-800 max-w-4xl mx-auto leading-tight">
                Create Magical Moments with 
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"> Perfect Return Gifts</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From birthday parties to weddings, we curate the perfect return gifts that make every guest feel special. 
                <span className="font-semibold text-purple-600"> No more guesswork, just pure joy!</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button 
                onClick={() => setShowForm(true)}
                size="lg"
                className="text-xl px-12 py-6 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
              >
                <Gift className="mr-3 w-6 h-6" />
                Start Creating Magic
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="text-xl px-12 py-6 rounded-full border-2 border-purple-300 hover:bg-purple-50 transition-all duration-300"
              >
                <Play className="mr-3 w-6 h-6" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Gallery Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              See the Magic in Action
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real moments, real smiles, real joy. Our return gifts create unforgettable memories.
            </p>
          </div>
          
          {/* Gift Exchange Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              { 
                title: "Birthday Party Magic", 
                description: "Kids exchanging colorful gift bags with toys and treats",
                image: "https://images.unsplash.com/photo-1530103862676-de8c9de0d1d2?w=400&h=300&fit=crop",
                gradient: "from-pink-400 to-purple-500"
              },
              { 
                title: "Wedding Elegance", 
                description: "Elegant return gifts for wedding guests",
                image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop",
                gradient: "from-rose-400 to-pink-500"
              },
              { 
                title: "Corporate Events", 
                description: "Professional return gifts for business events",
                image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop",
                gradient: "from-blue-400 to-cyan-500"
              },
              { 
                title: "Baby Shower Joy", 
                description: "Sweet return gifts for baby shower guests",
                image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop",
                gradient: "from-yellow-400 to-orange-500"
              },
              { 
                title: "Festival Celebrations", 
                description: "Traditional return gifts for cultural events",
                image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop",
                gradient: "from-green-400 to-emerald-500"
              },
              { 
                title: "Anniversary Special", 
                description: "Memorable return gifts for milestone celebrations",
                image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop",
                gradient: "from-purple-400 to-indigo-500"
              }
            ].map((item, index) => (
              <div key={index} className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <div className="aspect-[4/3] relative">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-60 group-hover:opacity-70 transition-opacity duration-300`}></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-sm opacity-90">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose Gifity?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make return gift planning effortless, memorable, and absolutely delightful.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-12 h-12 text-yellow-500" />,
                title: "Lightning Fast",
                description: "Get perfect recommendations in seconds, not hours of research."
              },
              {
                icon: <Users className="w-12 h-12 text-blue-500" />,
                title: "Personalized for Everyone",
                description: "Age-appropriate, theme-based gifts that suit every guest perfectly."
              },
              {
                icon: <Award className="w-12 h-12 text-purple-500" />,
                title: "Premium Quality",
                description: "Only the best products that create lasting impressions and memories."
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-pink-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Create Magic?
          </h3>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Join thousands of happy hosts who've made their events unforgettable with perfect return gifts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="text-xl px-12 py-6 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 bg-white text-purple-600 hover:bg-gray-50"
            >
              <Gift className="mr-3 w-6 h-6" />
              Start Your Gift Journey
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-6 h-6 text-green-300" />
              <span>Free to start • No commitment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
