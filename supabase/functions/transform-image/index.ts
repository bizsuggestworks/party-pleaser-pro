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
    const { imageUrl, eventTitle, transformOption, transformPrompt } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing imageUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[transform-image] Transforming image with nano-banana:", imageUrl);
    console.log("[transform-image] Transformation option:", transformOption);
    console.log("[transform-image] Custom prompt:", transformPrompt);

    // Use Replicate API for nano-banana style transformation
    // Note: Replicate accepts image URLs directly, so we don't need to fetch or convert the image
    const replicateApiKey = Deno.env.get("REPLICATE_API_TOKEN");
    
    let transformedImageUrl = imageUrl; // Fallback to original if transformation fails

    if (replicateApiKey) {
      try {
        console.log("[transform-image] Using Replicate API for nano-banana transformation");
        console.log("[transform-image] Original image URL:", imageUrl);
        
        // Use the google/nano-banana model for style transformation
        // The model accepts multiple images in image_input array
        // Use custom prompt if provided, otherwise use default
        const defaultPrompt = "Make the sheets in the style of the logo. Make the scene natural. ";
        const promptToUse = transformPrompt || defaultPrompt;
        
        const modelInput = {
          prompt: promptToUse,
          image_input: [imageUrl], // Use the URL directly in an array
        };
        
        console.log("[transform-image] Using prompt:", promptToUse);
        
        console.log("[transform-image] Calling Replicate API with model: google/nano-banana");
        // Avoid JSON.stringify on large objects to prevent stack overflow
        console.log("[transform-image] Input image URL:", imageUrl);
        
        // Use the model-specific endpoint to avoid needing a version hash
        const replicateResponse = await fetch("https://api.replicate.com/v1/models/google/nano-banana/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
            // Avoid JSON.stringify on potentially large objects
            console.log("[transform-image] Output type:", typeof result.output);
            console.log("[transform-image] Output is array:", Array.isArray(result.output));
            
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
                    console.warn("[transform-image] Object keys:", Object.keys(firstOutput).join(', '));
                    // Avoid JSON.stringify to prevent stack overflow
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
                console.log("[transform-image] ✓✓✓ Image transformed with nano-banana successfully! ✓✓✓");
                console.log("[transform-image] Original URL:", imageUrl);
                console.log("[transform-image] Transformed URL from Replicate:", transformedImageUrl);
                
                // Download the transformed image and upload to Supabase Storage for permanent access
                try {
                  console.log("[transform-image] Downloading transformed image from Replicate...");
                  const transformedImageResponse = await fetch(transformedImageUrl);
                  if (!transformedImageResponse.ok) {
                    throw new Error(`Failed to download transformed image: ${transformedImageResponse.status}`);
                  }
                  
                  const transformedImageBlob = await transformedImageResponse.blob();
                  console.log("[transform-image] Downloaded transformed image, size:", transformedImageBlob.size, "bytes");
                  
                  // Upload to Supabase Storage using REST API
                  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
                  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
                  
                  if (!supabaseUrl || !supabaseServiceKey) {
                    console.warn("[transform-image] Supabase credentials not found, returning Replicate URL directly");
                  } else {
                    const timestamp = Date.now();
                    const storagePath = `evite-uploads/transformed/nano-banana_${timestamp}.webp`;
                    
                    console.log("[transform-image] Uploading transformed image to Supabase Storage:", storagePath);
                    
                    // Convert blob to ArrayBuffer for upload
                    const arrayBuffer = await transformedImageBlob.arrayBuffer();
                    
                    // Upload using Supabase Storage REST API
                    const uploadUrl = `${supabaseUrl}/storage/v1/object/evite-uploads/${storagePath}`;
                    const uploadResponse = await fetch(uploadUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'image/webp',
                        'x-upsert': 'false',
                        'Cache-Control': '3600',
                      },
                      body: arrayBuffer,
                    });
                    
                    if (!uploadResponse.ok) {
                      const errorText = await uploadResponse.text();
                      console.warn("[transform-image] Failed to upload to Supabase Storage:", uploadResponse.status, errorText);
                      console.warn("[transform-image] Using Replicate URL directly (may expire)");
                    } else {
                      // Get public URL
                      const publicUrl = `${supabaseUrl}/storage/v1/object/public/evite-uploads/${storagePath}`;
                      transformedImageUrl = publicUrl;
                      console.log("[transform-image] ✓✓✓ Transformed image uploaded to Supabase Storage! ✓✓✓");
                      console.log("[transform-image] Permanent Supabase URL:", transformedImageUrl);
                    }
                  }
                } catch (storageError) {
                  console.warn("[transform-image] Error uploading to Supabase Storage:", storageError);
                  console.warn("[transform-image] Using Replicate URL directly (may expire or be blocked by email clients)");
                  // Continue with Replicate URL as fallback
                }
              } else {
                console.warn("[transform-image] ⚠️ Transformed URL validation failed");
                console.warn("[transform-image] Transformed URL:", transformedImageUrl);
                console.warn("[transform-image] Original URL:", imageUrl);
                console.warn("[transform-image] Is valid URL?", transformedImageUrl?.startsWith('http'));
              }
            } else {
              console.warn("[transform-image] Transformation succeeded but no output URL");
              console.warn("[transform-image] Result status:", result.status);
            }
          } else if (result.status === "failed") {
            console.error("[transform-image] Transformation failed with status: failed");
            if (result.error) {
              // Avoid JSON.stringify on potentially large error objects
              console.error("[transform-image] Error type:", typeof result.error);
              if (typeof result.error === 'string') {
                console.error("[transform-image] Error message:", result.error);
              } else if (result.error && typeof result.error === 'object') {
                console.error("[transform-image] Error keys:", Object.keys(result.error).join(', '));
              }
            }
          } else {
            console.warn("[transform-image] Transformation incomplete - status:", result.status);
            if (result.error) {
              console.warn("[transform-image] Error type:", typeof result.error);
            }
          }
        } else {
          const errorText = await replicateResponse.text();
          console.error("[transform-image] ❌ Replicate API error - Status:", replicateResponse.status);
          console.error("[transform-image] Error response body:", errorText);
          
          // Try to parse error for more details (limit length to prevent issues)
          try {
            const errorJson = JSON.parse(errorText);
            // Only log error message, not full object to prevent stack overflow
            if (errorJson.message) {
              console.error("[transform-image] Error message:", errorJson.message);
            }
            if (errorJson.detail) {
              console.error("[transform-image] Error detail:", errorJson.detail);
            }
          } catch {
            // Not JSON, just log a truncated version of the text
            const truncatedError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText;
            console.error("[transform-image] Error response (truncated):", truncatedError);
          }
        }
      } catch (replicateError) {
        console.error("[transform-image] Replicate transformation exception:", replicateError);
        console.error("[transform-image] Error details:", replicateError instanceof Error ? replicateError.message : String(replicateError));
      }
    } else {
      console.error("[transform-image] ❌ REPLICATE_API_TOKEN not set!");
      console.error("[transform-image] To enable nano-banana transformation:");
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

