// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declare Deno for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.info("transform-image function ready");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
        console.log("[transform-image] Original image URL:", imageUrl);
        console.log("[transform-image] Image size:", (imageBuffer.byteLength / 1024).toFixed(2), "KB");
        
        // Use the aaronaftab/mirage-ghibli model for Ghibli style transformation
        const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: "166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f", // aaronaftab/mirage-ghibli model
            input: {
              image: imageUrl, // Use the URL directly instead of base64
              prompt: "GHIBLI anime style photo",
              go_fast: true,
              guidance_scale: 10,
              prompt_strength: 0.77,
              num_inference_steps: 38,
            },
          }),
        });

        if (replicateResponse.ok) {
          const prediction = await replicateResponse.json();
          console.log("[transform-image] Replicate prediction created:", prediction.id);
          console.log("[transform-image] Prediction status:", prediction.status);
          
          // Poll for completion (max 30 seconds)
          let result = prediction;
          let attempts = 0;
          while ((result.status === "starting" || result.status === "processing") && attempts < 30) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
              headers: { "Authorization": `Token ${replicateApiKey}` },
            });
            
            if (!statusResponse.ok) {
              console.warn(`[transform-image] Status check failed: ${statusResponse.status}`);
              break;
            }
            
            result = await statusResponse.json();
            console.log(`[transform-image] Status check ${attempts}/30: ${result.status}`);
          }
          
          if (result.status === "succeeded") {
            if (result.output) {
              // Handle different output formats
              // The output might be an array of file objects or a single URL string
              if (Array.isArray(result.output)) {
                // If it's an array, get the first item
                const firstOutput = result.output[0];
                // Check if it's a file object with a url() method or a direct URL string
                if (typeof firstOutput === 'string') {
                  transformedImageUrl = firstOutput;
                } else if (firstOutput && typeof firstOutput === 'object' && firstOutput.url) {
                  // If it has a url property or method
                  transformedImageUrl = typeof firstOutput.url === 'function' ? firstOutput.url() : firstOutput.url;
                } else {
                  // Try to get URL from the object directly
                  transformedImageUrl = firstOutput;
                }
              } else if (typeof result.output === 'string') {
                transformedImageUrl = result.output;
              } else if (result.output.url) {
                transformedImageUrl = typeof result.output.url === 'function' ? result.output.url() : result.output.url;
              } else {
                transformedImageUrl = result.output;
              }
              
              console.log("[transform-image] ✓✓✓ Image transformed to Ghibli style successfully! ✓✓✓");
              console.log("[transform-image] Transformed URL:", transformedImageUrl);
              console.log("[transform-image] Output type:", typeof result.output, Array.isArray(result.output) ? 'array' : 'single');
            } else {
              console.warn("[transform-image] Transformation succeeded but no output URL");
            }
          } else if (result.status === "failed") {
            console.error("[transform-image] Transformation failed:", result.error);
            if (result.error) {
              console.error("[transform-image] Error details:", JSON.stringify(result.error, null, 2));
            }
          } else {
            console.warn("[transform-image] Transformation incomplete:", result.status, result.error);
          }
        } else {
          const errorText = await replicateResponse.text();
          console.error("[transform-image] Replicate API error:", replicateResponse.status, errorText);
        }
      } catch (replicateError) {
        console.error("[transform-image] Replicate transformation exception:", replicateError);
        console.error("[transform-image] Error details:", replicateError instanceof Error ? replicateError.message : String(replicateError));
      }
    } else {
      console.warn("[transform-image] REPLICATE_API_TOKEN not set. Add it in Supabase Dashboard → Edge Functions → Secrets to enable Ghibli transformation.");
      console.warn("[transform-image] Using original image (will still add 'Welcome to the party' text overlay)");
    }
    
    console.log("[transform-image] Final image URL (transformed or original):", transformedImageUrl);

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

