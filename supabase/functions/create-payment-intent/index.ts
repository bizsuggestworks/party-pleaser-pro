// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declare Deno for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('Payment processing server started');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { amount, currency, quantity, personalization, customerInfo } = body;

    console.log("Creating payment intent for:", { amount, currency, quantity });

    // Create order in database first
    const orderData = {
      amount: amount / 100, // Convert from cents to dollars
      currency,
      quantity,
      status: 'pending',
      personalization,
      customer_info: customerInfo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For now, we'll simulate Stripe integration
    // In production, you would:
    // 1. Create a Stripe Payment Intent
    // 2. Store the order in your database
    // 3. Return the client secret

    const mockClientSecret = `pi_mock_${orderId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Order created:", orderId);

    return new Response(
      JSON.stringify({ 
        clientSecret: mockClientSecret,
        orderId,
        message: "Payment intent created successfully"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating payment intent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
