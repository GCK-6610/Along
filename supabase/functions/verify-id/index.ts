// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { idImageBase64, selfieImageBase64 } = await req.json();

    if (!idImageBase64 || !selfieImageBase64) {
      return new Response(
        JSON.stringify({ error: 'Both idImageBase64 and selfieImageBase64 are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // @ts-ignore
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OPENAI_API_KEY secret is not configured in Supabase Edge Functions',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const cleanIdBase64 = String(idImageBase64).replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanSelfieBase64 = String(selfieImageBase64).replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert fraud detection and government identity verification assistant.
Analyze the two provided images:
1. An official ID document (Aadhaar, Driving License, Passport, PAN card, or College/Student ID).
2. A live selfie photograph taken by the user.

Verification Rules:
- Document Authenticity: Check if image 1 is an official government or college identity card. Reject if it is a plain piece of paper, handwritten note, blank sheet, cartoon, random object, or photo of a computer screen.
- Liveness & Face Presence: Check if image 2 contains a real, live human face. Reject if there is no human face present, or if it is an inanimate object/screen.
- Information Extraction: Extract the legal full name, gender ('male', 'female', or 'other'), date of birth (in YYYY-MM-DD or year of birth), and document type.

Respond ONLY with a valid JSON object matching this schema:
{
  "success": true,
  "isAuthenticDocument": true,
  "isRealHuman": true,
  "faceMatched": true,
  "extractedName": "string",
  "extractedGender": "male" | "female" | "other",
  "extractedDob": "YYYY-MM-DD" | null,
  "documentType": "string",
  "idNumberMasked": "string",
  "confidenceScore": 0.95,
  "rejectionReason": null
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Verify that image 1 is a valid ID card, extract the details (name, gender, DOB, type), and verify that image 2 contains a live human face.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${cleanIdBase64}`,
                  detail: 'low'
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${cleanSelfieBase64}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI vision error:', errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI vision verification failed (${response.status}): ${errText}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unexpected response from OpenAI vision model',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const result = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Verification failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
