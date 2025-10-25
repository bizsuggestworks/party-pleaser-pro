import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Search, 
  Filter,
  Send,
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  totalAmount: number;
  quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  personalization: {
    customNames: string[];
    customMessage: string;
    printNames: boolean;
    specialInstructions: string;
  };
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  address?: string;
  // Gift selection details
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
}

interface ChatMessage {
  id: string;
  orderId: string;
  customerName: string;
  message: string;
  isFromCustomer: boolean;
  timestamp: string;
}

export const AdminDashboard = () => {
  const { user, signOut, isAdmin, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load orders from localStorage (in a real app, this would be from a database)
  useEffect(() => {
    const savedOrders = localStorage.getItem('party-pleaser-orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      }
    } else {
      setOrders([]);
    }

    const savedMessages = localStorage.getItem('party-pleaser-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setChatMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
  }, []);

  // Redirect if not authenticated or not admin
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to access the admin dashboard.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges to access this page.</p>
          <p className="text-sm text-muted-foreground mb-4">Contact support if you believe this is an error.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedOrder) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      orderId: selectedOrder.id,
      customerName: "Admin",
      message: newMessage,
      isFromCustomer: false,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...chatMessages, message];
    setChatMessages(updatedMessages);
    setNewMessage("");
    
    // Save to localStorage
    localStorage.setItem('party-pleaser-messages', JSON.stringify(updatedMessages));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    );
    setOrders(updatedOrders);
    
    // Save to localStorage
    localStorage.setItem('party-pleaser-orders', JSON.stringify(updatedOrders));
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage orders and customer support</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
            <Button onClick={signOut} variant="outline">Sign Out</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{chatMessages.length}</p>
                  <p className="text-sm text-muted-foreground">Chat Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Orders</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{order.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>${order.totalAmount.toFixed(2)} • {order.quantity} bags</span>
                      <span className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Details & Chat */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedOrder ? `Order ${selectedOrder.id}` : 'Select an Order'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrder ? (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Order Details</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-4">
                      {/* Customer Information */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Customer Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                          <p><span className="font-medium">Email:</span> {selectedOrder.email}</p>
                          <p><span className="font-medium">Phone:</span> {selectedOrder.phone}</p>
                          {selectedOrder.address && <p><span className="font-medium">Address:</span> {selectedOrder.address}</p>}
                        </div>
                      </div>
                      
                      {/* Order Information */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Order Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Order ID:</span> {selectedOrder.id}</p>
                          <p><span className="font-medium">Total:</span> ${selectedOrder.totalAmount.toFixed(2)}</p>
                          <p><span className="font-medium">Quantity:</span> {selectedOrder.quantity} bags</p>
                          <p><span className="font-medium">Status:</span> 
                            <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                              {selectedOrder.status}
                            </Badge>
                          </p>
                          {selectedOrder.paymentMethod && <p><span className="font-medium">Payment:</span> {selectedOrder.paymentMethod}</p>}
                          <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Gift Selection Details */}
                      {selectedOrder.giftSelections && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Gift Selection Details
                          </h4>
                          <div className="space-y-3">
                            {selectedOrder.giftSelections.eventType && (
                              <p className="text-sm"><span className="font-medium">Event Type:</span> {selectedOrder.giftSelections.eventType}</p>
                            )}
                            {selectedOrder.giftSelections.theme && (
                              <p className="text-sm"><span className="font-medium">Theme:</span> {selectedOrder.giftSelections.theme}</p>
                            )}
                            {selectedOrder.giftSelections.budget && (
                              <p className="text-sm"><span className="font-medium">Budget:</span> {selectedOrder.giftSelections.budget}</p>
                            )}
                            {selectedOrder.giftSelections.bagSize && (
                              <p className="text-sm"><span className="font-medium">Bag Size:</span> {selectedOrder.giftSelections.bagSize}</p>
                            )}
                            
                            {selectedOrder.giftSelections.kids && selectedOrder.giftSelections.kids.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1">Kids:</p>
                                <div className="space-y-1">
                                  {selectedOrder.giftSelections.kids.map((kid, index) => (
                                    <p key={index} className="text-sm ml-2">• {kid.name} (age {kid.age})</p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedOrder.giftSelections.bags && selectedOrder.giftSelections.bags.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Selected Gift Bags:</p>
                                <div className="space-y-3">
                                  {selectedOrder.giftSelections.bags.map((bag, bagIndex) => (
                                    <div key={bagIndex} className="border rounded-lg p-3 bg-background">
                                      <h5 className="font-medium text-sm mb-2">{bag.bagTitle}</h5>
                                      <p className="text-xs text-muted-foreground mb-2">{bag.bagDescription}</p>
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium">Items included:</p>
                                        {bag.items.map((item, itemIndex) => (
                                          <p key={itemIndex} className="text-xs ml-2">• {item.title} ({item.category})</p>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Personalization Details */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Personalization Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedOrder.personalization.printNames && selectedOrder.personalization.customNames.length > 0 && (
                            <div>
                              <p className="font-medium">Custom Names to Print:</p>
                              <div className="ml-2">
                                {selectedOrder.personalization.customNames.map((name, index) => (
                                  <p key={index}>• {name}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedOrder.personalization.customMessage && (
                            <div>
                              <p className="font-medium">Special Message:</p>
                              <p className="ml-2 italic">"{selectedOrder.personalization.customMessage}"</p>
                            </div>
                          )}
                          
                          {selectedOrder.personalization.specialInstructions && (
                            <div>
                              <p className="font-medium">Special Instructions:</p>
                              <p className="ml-2">{selectedOrder.personalization.specialInstructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                          size="sm"
                          variant="outline"
                          disabled={selectedOrder.status === 'processing' || selectedOrder.status === 'completed'}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Mark Processing
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                          size="sm"
                          variant="outline"
                          disabled={selectedOrder.status === 'completed'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Completed
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                          size="sm"
                          variant="destructive"
                          disabled={selectedOrder.status === 'completed'}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Cancel Order
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="space-y-4">
                    <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
                      {chatMessages
                        .filter(msg => msg.orderId === selectedOrder.id)
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isFromCustomer ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg ${
                                message.isFromCustomer
                                  ? 'bg-muted'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button onClick={handleSendMessage} size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select an order to view details and chat
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
