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
    const { eventType, budget, requirement, theme, bagPreference } = await req.json();
    console.log("Generating gift recommendations for:", { eventType, budget, requirement, theme, bagPreference });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Generate gift recommendations with images
    const giftSystemPrompt = `You are an expert gift recommendation assistant. Based on the user's preferences, suggest 6 perfect return gifts.

For each gift, provide:
1. title: A clear, specific product name
2. description: Why this gift is perfect (2-3 sentences)
3. price: Estimated price range
4. category: The theme/category (e.g., "LEGO", "K-pop", "Minecraft")
5. buyLink: A real Amazon search URL for the product
6. imagePrompt: A detailed description for generating an image of this item (be specific about colors, style, setting)

Make recommendations specific to the theme. Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Product Name",
      "description": "Why this is perfect...",
      "price": "$10-15",
      "category": "LEGO",
      "buyLink": "https://www.amazon.com/s?k=product+name",
      "imagePrompt": "A colorful LEGO set with..."
    }
  ]
}`;

    const giftUserPrompt = `Event: ${eventType}
Budget: ${budget}
Type: ${requirement}
Theme/Interests: ${theme}

Generate 6 gift recommendations with detailed image prompts.`;

    console.log("Requesting gift recommendations from AI...");
    const giftResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: giftSystemPrompt },
          { role: 'user', content: giftUserPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!giftResponse.ok) {
      const errorText = await giftResponse.text();
      console.error('AI Gateway error for gifts:', giftResponse.status, errorText);
      throw new Error(`AI Gateway error: ${giftResponse.status}`);
    }

    const giftData = await giftResponse.json();
    console.log("Gift recommendations received");
    
    const giftContent = giftData.choices[0].message.content;
    let recommendations;
    
    try {
      const jsonMatch = giftContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations;
      } else {
        throw new Error("No JSON found in gift response");
      }
    } catch (parseError) {
      console.error("Error parsing gift response:", parseError);
      recommendations = [];
    }

    // Generate images for each gift
    console.log("Generating images for gifts...");
    const recommendationsWithImages = await Promise.all(
      recommendations.map(async (gift: any) => {
        try {
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: gift.imagePrompt || `A high-quality product photo of ${gift.title}, professional lighting, white background`
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { ...gift, imageUrl, imagePrompt: undefined };
          }
        } catch (error) {
          console.error("Error generating image for gift:", error);
        }
        return { ...gift, imagePrompt: undefined };
      })
    );

    // Generate bag recommendations
    const bagSystemPrompt = `You are a gift bag expert. Based on the event details and bag preferences, suggest 3 perfect gift bags that can fit the recommended items.

For each bag, provide:
1. title: Specific bag product name
2. description: Why this bag is perfect (size, design, material, fits all items)
3. price: Estimated price range
4. buyLink: A real Amazon search URL for the bag
5. imagePrompt: A detailed description for generating an image of this bag

Return ONLY valid JSON in this exact format:
{
  "bags": [
    {
      "title": "Bag Name",
      "description": "Perfect because...",
      "price": "$5-10",
      "buyLink": "https://www.amazon.com/s?k=bag+name",
      "imagePrompt": "A colorful gift bag with..."
    }
  ]
}`;

    const bagUserPrompt = `Event: ${eventType}
Budget: ${budget}
Bag Preference: ${bagPreference}
Theme: ${theme}

Generate 3 gift bag recommendations that match the theme and can fit the return gifts.`;

    console.log("Requesting bag recommendations from AI...");
    const bagResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: bagSystemPrompt },
          { role: 'user', content: bagUserPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!bagResponse.ok) {
      const errorText = await bagResponse.text();
      console.error('AI Gateway error for bags:', bagResponse.status, errorText);
      throw new Error(`AI Gateway error: ${bagResponse.status}`);
    }

    const bagData = await bagResponse.json();
    console.log("Bag recommendations received");
    
    const bagContent = bagData.choices[0].message.content;
    let bags;
    
    try {
      const jsonMatch = bagContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        bags = parsed.bags;
      } else {
        throw new Error("No JSON found in bag response");
      }
    } catch (parseError) {
      console.error("Error parsing bag response:", parseError);
      bags = [];
    }

    // Generate images for each bag
    console.log("Generating images for bags...");
    const bagsWithImages = await Promise.all(
      bags.map(async (bag: any) => {
        try {
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: bag.imagePrompt || `A high-quality product photo of ${bag.title}, professional lighting, clean background`
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { ...bag, imageUrl, imagePrompt: undefined };
          }
        } catch (error) {
          console.error("Error generating image for bag:", error);
        }
        return { ...bag, imagePrompt: undefined };
      })
    );

    console.log("Sending complete recommendations with images");

    return new Response(
      JSON.stringify({ 
        recommendations: recommendationsWithImages,
        bags: bagsWithImages
      }),
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
