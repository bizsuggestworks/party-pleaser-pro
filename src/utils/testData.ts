// Test data for admin dashboard
export const createTestOrder = () => {
  const testOrder = {
    id: "test_order_123",
    customerName: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    totalAmount: 50.00,
    quantity: 2,
    status: 'pending' as const,
    personalization: {
      customNames: ["Emma", "Liam"],
      customMessage: "Happy Birthday!",
      printNames: true,
      specialInstructions: "Please wrap in blue paper"
    },
    giftSelections: {
      eventType: "Birthday Party",
      theme: "LEGO & Building Blocks",
      budget: "$25 per bag",
      bagSize: "Medium",
      kids: [
        { name: "Emma", age: 8 },
        { name: "Liam", age: 6 }
      ],
      bags: [
        {
          bagTitle: "LEGO Adventure Bag",
          bagDescription: "Perfect for young builders",
          items: [
            {
              title: "LEGO Classic Creative Box",
              description: "LEGO building set with 484 pieces",
              category: "LEGO & Building Blocks",
              imageUrl: "https://m.media-amazon.com/images/I/81xQx8QJZJL._AC_SL1500_.jpg"
            },
            {
              title: "LEGO Creator 3-in-1 Deep Sea Creatures",
              description: "Build a shark, squid, or angler fish",
              category: "LEGO & Building Blocks",
              imageUrl: "https://m.media-amazon.com/images/I/81xQx8QJZJL._AC_SL1500_.jpg"
            }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentMethod: "card",
    address: "123 Main St, Anytown, USA"
  };

  // Add to localStorage
  const existingOrders = JSON.parse(localStorage.getItem('party-pleaser-orders') || '[]');
  existingOrders.push(testOrder);
  localStorage.setItem('party-pleaser-orders', JSON.stringify(existingOrders));
  
  return testOrder;
};

// Call this function to add test data
// createTestOrder();
