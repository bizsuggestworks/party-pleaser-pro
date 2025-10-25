// Mock API endpoint for payment processing
// In production, this would be a real API endpoint

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency, quantity, personalization, customerInfo } = req.body;

  // Generate a unique order ID
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Mock client secret for Stripe
  const clientSecret = `pi_mock_${orderId}_secret_${Math.random().toString(36).substr(2, 9)}`;

  // In production, you would:
  // 1. Create a real Stripe Payment Intent
  // 2. Store the order in your database
  // 3. Return the real client secret

  res.status(200).json({
    clientSecret,
    orderId,
    message: "Payment intent created successfully"
  });
}
