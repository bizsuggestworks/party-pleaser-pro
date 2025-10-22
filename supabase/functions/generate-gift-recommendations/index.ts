import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, budget, requirement, theme } = await req.json();
    console.log("Generating gift recommendations for:", { eventType, budget, requirement, theme });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert gift recommendation assistant. Based on the user's preferences, suggest 6 perfect return gifts.

For each gift, provide:
1. title: A clear, specific product name
2. description: Why this gift is perfect (2-3 sentences)
3. price: Estimated price range
4. category: The theme/category (e.g., "LEGO", "K-pop", "Minecraft")
5. buyLink: A real Amazon search URL for the product

Make recommendations specific to the theme. If theme mentions:
- LEGO: Suggest specific LEGO sets appropriate for the event
- Minecraft: Minecraft toys, books, or merchandise
- K-pop: K-pop themed items, albums, merchandise
- Demon Slayer: Anime merchandise
- Generic: Popular trending items for the age group

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Product Name",
      "description": "Why this is perfect...",
      "price": "$10-15",
      "category": "LEGO",
      "buyLink": "https://www.amazon.com/s?k=product+name"
    }
  ]
}`;

    const userPrompt = `Event: ${eventType}
Budget: ${budget}
Type: ${requirement}
Theme/Interests: ${theme}

Generate 6 gift recommendations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);
    
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let recommendations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback recommendations if parsing fails
      recommendations = [
        {
          title: "LEGO Classic Creative Building Set",
          description: "Perfect for creative kids, this set includes 1000+ pieces for endless building possibilities.",
          price: budget,
          category: "LEGO",
          buyLink: "https://www.amazon.com/s?k=lego+classic+set"
        },
        {
          title: "Minecraft Action Figures Set",
          description: "Bring the Minecraft world to life with these collectible action figures.",
          price: budget,
          category: "Minecraft",
          buyLink: "https://www.amazon.com/s?k=minecraft+action+figures"
        },
        {
          title: "K-pop Photo Card Set",
          description: "Collectible photo cards from popular K-pop groups that fans will love.",
          price: budget,
          category: "K-pop",
          buyLink: "https://www.amazon.com/s?k=kpop+photo+cards"
        }
      ];
    }

    console.log("Sending recommendations:", recommendations);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-recommendations:', error);
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
