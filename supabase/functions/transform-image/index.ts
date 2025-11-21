// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declare Deno for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info("transform-image function ready");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageUrl, eventTitle } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing imageUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[transform-image] Transforming image to Ghibli style:", imageUrl);

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Use Replicate API for Ghibli style transformation
    const replicateApiKey = Deno.env.get("REPLICATE_API_TOKEN");
    
    let transformedImageUrl = imageUrl; // Fallback to original if transformation fails

    if (replicateApiKey) {
      try {
        console.log("[transform-image] Using Replicate API for Ghibli transformation");
        
        // Use a Ghibli-style image-to-image model
        // You can use models like: "luma/photon" or "fofr/studio-ghibli" or similar
        const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b1052fea6cd", // Example model ID - replace with actual Ghibli model
            input: {
              image: `data:image/jpeg;base64,${imageBase64}`,
              prompt: "Studio Ghibli art style, vibrant colors, whimsical, magical atmosphere, anime style",
              strength: 0.7,
            },
          }),
        });

        if (replicateResponse.ok) {
          const prediction = await replicateResponse.json();
          console.log("[transform-image] Replicate prediction created:", prediction.id);
          
          // Poll for completion (max 30 seconds)
          let result = prediction;
          let attempts = 0;
          while ((result.status === "starting" || result.status === "processing") && attempts < 30) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
              headers: { "Authorization": `Token ${replicateApiKey}` },
            });
            result = await statusResponse.json();
            console.log(`[transform-image] Status check ${attempts}/30: ${result.status}`);
          }
          
          if (result.status === "succeeded" && result.output && result.output.length > 0) {
            transformedImageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            console.log("[transform-image] ✓ Image transformed to Ghibli style:", transformedImageUrl);
          } else {
            console.warn("[transform-image] Transformation incomplete:", result.status, result.error);
          }
        } else {
          const errorText = await replicateResponse.text();
          console.warn("[transform-image] Replicate API error:", replicateResponse.status, errorText);
        }
      } catch (replicateError) {
        console.warn("[transform-image] Replicate transformation failed, using original:", replicateError);
      }
    } else {
      console.warn("[transform-image] REPLICATE_API_TOKEN not set. Add it in Supabase Dashboard → Edge Functions → Secrets to enable Ghibli transformation.");
      console.warn("[transform-image] Using original image (will still add 'Welcome to the party' text overlay)");
    }

    // Add text overlay "Welcome to the party" using a simple approach
    // For production, use a proper image processing library
    // For now, we'll return the transformed image and add text in the email template
    
    return new Response(
      JSON.stringify({
        transformedImageUrl,
        originalImageUrl: imageUrl,
        hasText: true,
        text: eventTitle ? `Welcome to ${eventTitle}` : "Welcome to the party",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("transform-image error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

