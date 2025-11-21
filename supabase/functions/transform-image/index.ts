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

    // Fetch the original image to verify it's accessible
    // Note: We don't need to convert to base64 since Replicate accepts URLs directly
    const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
    if (!imageResponse.ok) {
      console.warn(`[transform-image] Image HEAD check failed: ${imageResponse.status}, but continuing with URL`);
      // Don't throw - Replicate might still be able to fetch it
    }

    // Use Replicate API for Ghibli style transformation
    const replicateApiKey = Deno.env.get("REPLICATE_API_TOKEN");
    
    let transformedImageUrl = imageUrl; // Fallback to original if transformation fails

    if (replicateApiKey) {
      try {
        console.log("[transform-image] Using Replicate API for Ghibli transformation");
        console.log("[transform-image] Original image URL:", imageUrl);
        
        // Use the aaronaftab/mirage-ghibli model for Ghibli style transformation
        // Try using the model name directly first, then fallback to version
        const modelInput = {
          image: imageUrl, // Use the URL directly
          prompt: "GHIBLI anime style photo",
          go_fast: true,
          guidance_scale: 10,
          prompt_strength: 0.77,
          num_inference_steps: 38,
        };
        
        console.log("[transform-image] Calling Replicate API with model:", "aaronaftab/mirage-ghibli");
        console.log("[transform-image] Input:", JSON.stringify(modelInput, null, 2));
        
        const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: "166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f", // aaronaftab/mirage-ghibli:166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f
            input: modelInput,
          }),
        });
        
        console.log("[transform-image] Replicate API response status:", replicateResponse.status);

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
            console.log("[transform-image] Transformation succeeded! Processing output...");
            console.log("[transform-image] Raw output:", JSON.stringify(result.output, null, 2));
            
            if (result.output) {
              // According to Replicate API: output is an array where output[0] has a .url() method
              // In REST API, it's typically an array of URL strings
              if (Array.isArray(result.output) && result.output.length > 0) {
                console.log("[transform-image] Output is an array with", result.output.length, "items");
                const firstOutput = result.output[0];
                
                // REST API typically returns array of URL strings
                if (typeof firstOutput === 'string' && firstOutput.startsWith('http')) {
                  transformedImageUrl = firstOutput;
                  console.log("[transform-image] ✓ Extracted URL string from array:", transformedImageUrl);
                }
                // Handle object with url property or method (SDK style, but might appear in REST API)
                else if (firstOutput && typeof firstOutput === 'object') {
                  if (typeof firstOutput.url === 'function') {
                    transformedImageUrl = firstOutput.url();
                    console.log("[transform-image] ✓ Extracted URL via .url() method:", transformedImageUrl);
                  } else if (firstOutput.url && typeof firstOutput.url === 'string') {
                    transformedImageUrl = firstOutput.url;
                    console.log("[transform-image] ✓ Extracted URL from .url property:", transformedImageUrl);
                  } else {
                    // Log the structure to understand what we're getting
                    console.warn("[transform-image] Array item is object but no URL found");
                    console.warn("[transform-image] Object keys:", Object.keys(firstOutput));
                    console.warn("[transform-image] Object structure:", JSON.stringify(firstOutput, null, 2));
                  }
                }
                // Fallback: try to convert to string
                else {
                  const outputStr = String(firstOutput);
                  if (outputStr.startsWith('http')) {
                    transformedImageUrl = outputStr;
                    console.log("[transform-image] ✓ Extracted URL from string conversion:", transformedImageUrl);
                  } else {
                    console.warn("[transform-image] Could not extract valid URL from array item");
                    console.warn("[transform-image] First output type:", typeof firstOutput);
                    console.warn("[transform-image] First output value:", firstOutput);
                  }
                }
              } 
              // Handle single string URL (fallback)
              else if (typeof result.output === 'string') {
                transformedImageUrl = result.output;
                console.log("[transform-image] Output is a single string URL:", transformedImageUrl);
              } 
              // Handle object with url property
              else if (result.output && typeof result.output === 'object' && result.output.url) {
                transformedImageUrl = typeof result.output.url === 'function' ? result.output.url() : result.output.url;
                console.log("[transform-image] Extracted URL from object.url:", transformedImageUrl);
              }
              
              if (transformedImageUrl && transformedImageUrl !== imageUrl && transformedImageUrl.startsWith('http')) {
                console.log("[transform-image] ✓✓✓ Image transformed to Ghibli style successfully! ✓✓✓");
                console.log("[transform-image] Original URL:", imageUrl);
                console.log("[transform-image] Transformed URL:", transformedImageUrl);
              } else {
                console.warn("[transform-image] ⚠️ Transformed URL validation failed");
                console.warn("[transform-image] Transformed URL:", transformedImageUrl);
                console.warn("[transform-image] Original URL:", imageUrl);
                console.warn("[transform-image] Is valid URL?", transformedImageUrl?.startsWith('http'));
              }
            } else {
              console.warn("[transform-image] Transformation succeeded but no output URL");
              console.warn("[transform-image] Full result:", JSON.stringify(result, null, 2));
            }
          } else if (result.status === "failed") {
            console.error("[transform-image] Transformation failed with status: failed");
            console.error("[transform-image] Error object:", JSON.stringify(result.error, null, 2));
            if (result.error) {
              console.error("[transform-image] Error details:", JSON.stringify(result.error, null, 2));
            }
            console.error("[transform-image] Full result:", JSON.stringify(result, null, 2));
          } else {
            console.warn("[transform-image] Transformation incomplete - status:", result.status);
            console.warn("[transform-image] Result:", JSON.stringify(result, null, 2));
            if (result.error) {
              console.warn("[transform-image] Error:", JSON.stringify(result.error, null, 2));
            }
          }
        } else {
          const errorText = await replicateResponse.text();
          console.error("[transform-image] ❌ Replicate API error - Status:", replicateResponse.status);
          console.error("[transform-image] Error response body:", errorText);
          
          // Try to parse error for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error("[transform-image] Parsed error JSON:", JSON.stringify(errorJson, null, 2));
          } catch {
            // Not JSON, just log the text
            console.error("[transform-image] Error is not JSON format");
          }
          console.error("[transform-image] Error response:", errorText);
          
          // Try to parse error for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error("[transform-image] Parsed error:", JSON.stringify(errorJson, null, 2));
          } catch {
            // Not JSON, just log the text
          }
        }
      } catch (replicateError) {
        console.error("[transform-image] Replicate transformation exception:", replicateError);
        console.error("[transform-image] Error details:", replicateError instanceof Error ? replicateError.message : String(replicateError));
      }
    } else {
      console.error("[transform-image] ❌ REPLICATE_API_TOKEN not set!");
      console.error("[transform-image] To enable Ghibli transformation:");
      console.error("[transform-image] 1. Get your API token from https://replicate.com/account/api-tokens");
      console.error("[transform-image] 2. Add it in Supabase Dashboard → Edge Functions → Secrets → REPLICATE_API_TOKEN");
      console.warn("[transform-image] Using original image (no transformation will occur)");
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

