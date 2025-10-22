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

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  try {
    const body = await req.json();
    const { action } = body;
    console.log("Request received:", { action, body });

    // Handle theme generation
    if (action === "generate-themes") {
      const { nationality, kids } = body;
      
      const themePrompt = `Based on these demographics, suggest 5 popular gift themes that would be perfect:
Nationality: ${nationality}
Kids: ${kids.map((k: any) => `${k.age} year old ${k.gender}`).join(", ")}

Consider age-appropriate themes, gender preferences, and cultural relevance. Return ONLY a JSON array of theme names.
Example format: ["LEGO & Building", "K-pop & Music", "Sports & Outdoor"]`;

      const themeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: themePrompt }],
          temperature: 0.8,
        }),
      });

      if (!themeResponse.ok) {
        throw new Error(`Theme generation failed: ${themeResponse.status}`);
      }

      const themeData = await themeResponse.json();
      const themesText = themeData.choices[0].message.content;
      const themesMatch = themesText.match(/\[[\s\S]*\]/);
      const themes = themesMatch ? JSON.parse(themesMatch[0]) : [];

      return new Response(
        JSON.stringify({ themes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle gift recommendations
    const { eventType, budget, requirement, theme, bagSize, quantity } = body;
    console.log("Generating gift recommendations for:", { eventType, budget, requirement, theme, bagSize, quantity });

    // Parse budget
    const budgetMatch = budget.match(/[\d.]+/);
    const maxBudgetPerBag = budgetMatch ? parseFloat(budgetMatch[0]) : 10;

    // Determine items per bag based on bag size
    const itemsPerBag = bagSize.includes("Small") ? 6 : bagSize.includes("Medium") ? 8 : 10;
    
    // Calculate target price per item (reserve 20% for the bag itself)
    const budgetForItems = maxBudgetPerBag * 0.8;
    const targetPricePerItem = budgetForItems / itemsPerBag;

    // Generate bag contents with items
    const bagSystemPrompt = `You are an expert gift curator. Create 3 complete gift bag packages for a ${eventType}.

For EACH bag, provide:
1. bagTitle: Name of the gift bag style
2. bagDescription: Description of the bag (size, design, material)
3. bagPrice: Price of just the bag (numeric, 15-20% of total budget)
4. bagBuyLink: Amazon search URL for the bag
5. bagImagePrompt: Description for generating bag image
6. items: Array of ${itemsPerBag} gift items that go IN this bag

For EACH item in the bag:
- title: Specific product name
- description: Brief description (1 sentence)
- price: Numeric price that fits budget (aim for $${targetPricePerItem.toFixed(2)} per item)
- category: Item category matching theme
- buyLink: Amazon search URL
- imagePrompt: Description for generating item image

CRITICAL: Total items price + bag price must NOT exceed $${maxBudgetPerBag}

Return ONLY valid JSON:
{
  "bags": [
    {
      "bagTitle": "Colorful Party Bags",
      "bagDescription": "Medium-sized vibrant bags",
      "bagPrice": 2.5,
      "bagBuyLink": "https://www.amazon.com/s?k=party+bags",
      "bagImagePrompt": "Colorful paper gift bags...",
      "items": [
        {
          "title": "Mini LEGO Set",
          "description": "Small building set",
          "price": 1.2,
          "category": "LEGO",
          "buyLink": "https://www.amazon.com/s?k=mini+lego",
          "imagePrompt": "Small LEGO set in box..."
        }
      ]
    }
  ]
}`;

    const bagUserPrompt = `Event: ${eventType}
Max Budget Per Bag: $${maxBudgetPerBag}
Items Per Bag: ${itemsPerBag}
Theme: ${theme}
Bag Size: ${bagSize}
Number of Bags Needed: ${quantity}

Create 3 different bag options, each with ${itemsPerBag} items that fit within $${maxBudgetPerBag} total budget.`;

    console.log("Requesting bag and item recommendations from AI...");
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
      console.error('AI Gateway error:', bagResponse.status, errorText);
      throw new Error(`AI Gateway error: ${bagResponse.status}`);
    }

    const bagData = await bagResponse.json();
    console.log("Bag and item recommendations received");
    
    const bagContent = bagData.choices[0].message.content;
    let bags;
    
    try {
      const jsonMatch = bagContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        bags = parsed.bags;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      bags = [];
    }

    // Generate images for bags and items
    console.log("Generating images for bags and items...");
    const bagsWithImages = await Promise.all(
      bags.map(async (bag: any) => {
        // Generate bag image
        let bagImageUrl;
        try {
          const bagImageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: bag.bagImagePrompt || `A high-quality product photo of ${bag.bagTitle}, professional lighting`
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (bagImageResponse.ok) {
            const imageData = await bagImageResponse.json();
            bagImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          }
        } catch (error) {
          console.error("Error generating bag image:", error);
        }

        // Generate images for items
        const itemsWithImages = await Promise.all(
          (bag.items || []).map(async (item: any) => {
            try {
              const itemImageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                      content: item.imagePrompt || `Product photo of ${item.title}, white background`
                    }
                  ],
                  modalities: ["image", "text"]
                }),
              });

              if (itemImageResponse.ok) {
                const imageData = await itemImageResponse.json();
                const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                return { ...item, imageUrl, imagePrompt: undefined };
              }
            } catch (error) {
              console.error("Error generating item image:", error);
            }
            return { ...item, imagePrompt: undefined };
          })
        );

        // Calculate totals
        const totalItemsCost = itemsWithImages.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
        const totalBagCost = totalItemsCost + (bag.bagPrice || 0);

        return {
          bagTitle: bag.bagTitle,
          bagDescription: bag.bagDescription,
          bagPrice: bag.bagPrice || 0,
          bagBuyLink: bag.bagBuyLink,
          bagImageUrl,
          items: itemsWithImages,
          totalItemsCost,
          totalBagCost
        };
      })
    );

    // Calculate pricing
    const avgPricePerBag = bagsWithImages.reduce((sum, bag) => sum + bag.totalBagCost, 0) / bagsWithImages.length;
    const totalCost = avgPricePerBag * (quantity || 1);

    console.log("Sending complete recommendations with images and pricing");

    return new Response(
      JSON.stringify({ 
        bags: bagsWithImages,
        quantity: quantity || 1,
        pricePerBag: avgPricePerBag,
        totalCost
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
