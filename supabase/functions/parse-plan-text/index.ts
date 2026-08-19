// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // @ts-ignore
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in Edge Function secrets');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts event plan details from natural language text.
You MUST respond ONLY with a valid JSON object matching this schema:
{
  "title": "string (A catchy title for the event, e.g. 'Morning Run in the Park', max 30 chars)",
  "venue": "string (The location extracted, e.g. 'Lodhi Gardens')",
  "tags": ["string"] (Array of 1 to 3 relevant tags, e.g. ["fitness", "outdoors", "running"]),
  "capacity": "string (Number between '2' and '20', default to '4' if unspecified)",
  "latitude": "number (Approximate latitude of venue, default to 28.5921 if unknown)",
  "longitude": "number (Approximate longitude of venue, default to 77.2250 if unknown)"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error:', errorText);
      throw new Error('Failed to parse with OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Get Vector Embedding
    const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `${parsed.title} at ${parsed.venue}. Tags: ${parsed.tags?.join(', ')}`,
      })
    });
    
    let embedding = null;
    if (embedResponse.ok) {
      const embedData = await embedResponse.json();
      embedding = embedData.data[0].embedding;
    }

    return new Response(
      JSON.stringify({
        title: parsed.title || 'Group Plan',
        venue: parsed.venue || 'City Center',
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['social'],
        capacity: parsed.capacity || '4',
        latitude: parsed.latitude || 28.5921,
        longitude: parsed.longitude || 77.2250,
        embedding: embedding,
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge function error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
