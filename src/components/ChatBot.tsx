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
      text: "Hi! I'm your Party Pleaser Pro assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Simple keyword matching
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
    
    return "I'm here to help! You can ask me about our gift bags, shipping, customization options, or anything else. If I can't answer your question, I'll connect you with our support team.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = findBestAnswer(inputText);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
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
    "How long does shipping take?",
    "Can I customize my bags?",
    "What's included in each bag?",
    "Do you offer refunds?"
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
                <CardTitle className="text-lg">Party Pleaser Pro</CardTitle>
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
