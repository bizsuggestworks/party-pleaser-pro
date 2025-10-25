import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, X, MessageSquare } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  orderId?: string;
  customerEmail?: string;
}

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

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQ[] = [
  {
    question: "How long does it take to prepare my gift bags?",
    answer: "We typically prepare and ship gift bags within 3-5 business days. For personalized items, it may take an additional 1-2 days.",
    category: "Shipping"
  },
  {
    question: "Can I customize the items in my gift bags?",
    answer: "Yes! You can add custom names, special messages, and specific instructions when placing your order. We'll do our best to accommodate your requests.",
    category: "Customization"
  },
  {
    question: "What's included in each gift bag?",
    answer: "Each gift bag contains 6-10 carefully selected items based on your theme and budget. We include a mix of toys, crafts, and activities that are age-appropriate and fun!",
    category: "Products"
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer full refunds within 30 days if you're not satisfied with your order. Please contact us with your order number to process a refund.",
    category: "Returns"
  },
  {
    question: "How much does shipping cost?",
    answer: "Shipping is included in the price of your gift bags! We offer free shipping on all orders within the continental US.",
    category: "Shipping"
  },
  {
    question: "Can I track my order?",
    answer: "Yes! Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account dashboard.",
    category: "Shipping"
  }
];

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hi! I'm your Giftify assistant. How can I help you today? You can ask about your order by providing your order number or email address.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load orders from localStorage
  const loadOrders = (): Order[] => {
    try {
      const savedOrders = localStorage.getItem('party-pleaser-orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  };

  // Save chat message to localStorage
  const saveChatMessage = (message: ChatMessage) => {
    try {
      const savedMessages = localStorage.getItem('party-pleaser-messages');
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      const newMessage = {
        id: message.id,
        orderId: message.orderId || currentOrder?.id,
        customerName: currentOrder?.customerName || 'Customer',
        message: message.text,
        isFromCustomer: !message.isBot,
        timestamp: message.timestamp.toISOString()
      };
      messages.push(newMessage);
      localStorage.setItem('party-pleaser-messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  // Find order by ID or email
  const findOrder = (query: string): Order | null => {
    const orders = loadOrders();
    const lowerQuery = query.toLowerCase().trim();
    
    console.log('Searching for order:', lowerQuery);
    console.log('Available orders:', orders.map(o => ({ id: o.id, email: o.email })));
    
    // Try to find by order ID first (exact match)
    let order = orders.find(order => order.id.toLowerCase() === lowerQuery);
    
    // If not found by exact ID, try partial match
    if (!order) {
      order = orders.find(order => order.id.toLowerCase().includes(lowerQuery));
    }
    
    // If not found by ID, try email
    if (!order) {
      order = orders.find(order => order.email.toLowerCase() === lowerQuery);
    }
    
    // If still not found, try partial email match
    if (!order) {
      order = orders.find(order => order.email.toLowerCase().includes(lowerQuery));
    }
    
    console.log('Found order:', order);
    return order || null;
  };

  // Get all orders for an email
  const getOrdersByEmail = (email: string): Order[] => {
    const orders = loadOrders();
    return orders.filter(order => order.email.toLowerCase() === email.toLowerCase());
  };

  // Load chat history for an order
  const loadChatHistory = (orderId: string): ChatMessage[] => {
    try {
      const savedMessages = localStorage.getItem('party-pleaser-messages');
      if (!savedMessages) return [];
      
      const messages = JSON.parse(savedMessages);
      const orderMessages = messages
        .filter((msg: any) => msg.orderId === orderId)
        .map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          isBot: !msg.isFromCustomer,
          timestamp: new Date(msg.timestamp),
          orderId: msg.orderId,
          customerEmail: msg.customerName
        }));
      
      return orderMessages;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  };

  const findBestAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Check for order number or email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const orderIdPattern = /^[A-Z0-9-_]+$/i;
    const paypalPattern = /paypal_\d+_[a-z0-9]+/i;
    
    // Check if user provided order number or email
    if (emailPattern.test(question) || orderIdPattern.test(question.trim()) || paypalPattern.test(question.trim())) {
      const order = findOrder(question.trim());
      if (order) {
        setCurrentOrder(order);
        setCustomerEmail(order.email);
        
        // Load chat history for this order
        const chatHistory = loadChatHistory(order.id);
        if (chatHistory.length > 0) {
          setMessages(prev => [...prev, ...chatHistory]);
        }
        
        return `I found your order! Here are the details:

**Order ID:** ${order.id}
**Customer:** ${order.customerName}
**Status:** ${order.status}
**Total:** $${order.totalAmount.toFixed(2)}
**Quantity:** ${order.quantity} bags
**Order Date:** ${new Date(order.createdAt).toLocaleDateString()}

${order.giftSelections?.theme ? `**Theme:** ${order.giftSelections.theme}` : ''}
${order.giftSelections?.eventType ? `**Event Type:** ${order.giftSelections.eventType}` : ''}

Is there anything specific you'd like to know about this order?`;
      } else {
        // Try to find by email if it looks like an email
        if (emailPattern.test(question)) {
          const orders = getOrdersByEmail(question.trim());
          if (orders.length > 0) {
            setCustomerEmail(question.trim());
            return `I found ${orders.length} order(s) for ${question.trim()}:

${orders.map(order => `• Order ${order.id} - $${order.totalAmount.toFixed(2)} (${order.status}) - ${new Date(order.createdAt).toLocaleDateString()}`).join('\n')}

Please provide the specific order number you'd like to know about.`;
          }
        }
        return `I couldn't find an order with that information. Please check your order number or email address and try again. You can also contact our support team for assistance.`;
      }
    }
    
    // Simple keyword matching for FAQ
    for (const faq of faqData) {
      const keywords = faq.question.toLowerCase().split(' ');
      const questionWords = lowerQuestion.split(' ');
      
      const matchCount = keywords.filter(keyword => 
        questionWords.some(word => word.includes(keyword) || keyword.includes(word))
      ).length;
      
      if (matchCount >= 2) {
        return faq.answer;
      }
    }
    
    // Order-specific responses when we have an order context
    if (currentOrder) {
      if (lowerQuestion.includes('status') || lowerQuestion.includes('where') || lowerQuestion.includes('track')) {
        return `Your order ${currentOrder.id} is currently **${currentOrder.status}**. ${currentOrder.status === 'pending' ? 'We\'re preparing your gift bags and will update you soon!' : currentOrder.status === 'processing' ? 'Your order is being prepared and will ship soon!' : currentOrder.status === 'completed' ? 'Your order has been completed and should arrive soon!' : 'Your order has been cancelled.'}`;
      }
      
      if (lowerQuestion.includes('items') || lowerQuestion.includes('what') || lowerQuestion.includes('include')) {
        if (currentOrder.giftSelections?.bags && currentOrder.giftSelections.bags.length > 0) {
          const bag = currentOrder.giftSelections.bags[0];
          return `Your order includes the **${bag.bagTitle}** gift bag with these items:
          
${bag.items.map(item => `• ${item.title} (${item.category})`).join('\n')}

${bag.bagDescription}`;
        }
        return "I can see your order details, but the specific items aren't available yet. Our team will curate the perfect items based on your preferences!";
      }
      
      if (lowerQuestion.includes('personal') || lowerQuestion.includes('custom')) {
        if (currentOrder.personalization.customNames.length > 0 || currentOrder.personalization.customMessage) {
          return `Your order includes these personalizations:
          
${currentOrder.personalization.customNames.length > 0 ? `**Custom Names:** ${currentOrder.personalization.customNames.join(', ')}` : ''}
${currentOrder.personalization.customMessage ? `**Special Message:** "${currentOrder.personalization.customMessage}"` : ''}
${currentOrder.personalization.specialInstructions ? `**Special Instructions:** ${currentOrder.personalization.specialInstructions}` : ''}`;
        }
        return "No customizations were added to this order. If you'd like to add personalizations, please contact our support team.";
      }
    }
    
    // Fallback responses based on keywords
    if (lowerQuestion.includes('time') || lowerQuestion.includes('long') || lowerQuestion.includes('when')) {
      return "We typically prepare gift bags within 3-5 business days. For personalized items, it may take an additional 1-2 days.";
    }
    
    if (lowerQuestion.includes('custom') || lowerQuestion.includes('personalize') || lowerQuestion.includes('name')) {
      return "Yes! You can add custom names, special messages, and specific instructions when placing your order. We'll do our best to accommodate your requests.";
    }
    
    if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('expensive')) {
      return "Our gift bags start at $15.99 and include 6-10 carefully selected items. The price depends on your budget and the number of bags you order.";
    }
    
    if (lowerQuestion.includes('shipping') || lowerQuestion.includes('delivery') || lowerQuestion.includes('ship')) {
      return "Shipping is included in the price! We offer free shipping on all orders within the continental US. Orders typically arrive within 3-5 business days.";
    }
    
    if (lowerQuestion.includes('refund') || lowerQuestion.includes('return') || lowerQuestion.includes('money back')) {
      return "We offer full refunds within 30 days if you're not satisfied with your order. Please contact us with your order number to process a refund.";
    }
    
    // Debug: Show available orders if user asks
    if (lowerQuestion.includes('debug') || lowerQuestion.includes('show orders') || lowerQuestion.includes('list orders')) {
      const orders = loadOrders();
      if (orders.length === 0) {
        return "No orders found in the system. Please place an order first.";
      }
      return `Available orders:\n\n${orders.map(order => `• ${order.id} - ${order.customerName} (${order.email}) - $${order.totalAmount.toFixed(2)}`).join('\n')}\n\nPlease provide the exact order ID you want to know about.`;
    }
    
    return "I'm here to help! You can ask me about your order by providing your order number or email address, or ask about our gift bags, shipping, customization options, or anything else.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
      orderId: currentOrder?.id,
      customerEmail: customerEmail
    };

    setMessages(prev => [...prev, userMessage]);
    saveChatMessage(userMessage);
    setInputText("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = findBestAnswer(inputText);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
        orderId: currentOrder?.id,
        customerEmail: customerEmail
      };
      
      setMessages(prev => [...prev, botMessage]);
      saveChatMessage(botMessage);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Check my order status",
    "Show available orders",
    "How long does shipping take?",
    "Can I customize my bags?"
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 z-40"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Giftify Assistant</CardTitle>
                  {currentOrder && (
                    <p className="text-xs text-muted-foreground">
                      Order: {currentOrder.id} • {currentOrder.customerName}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.isBot
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="p-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((question, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setInputText(question)}
                    >
                      {question}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
