// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[send-push-notification] Received payload:', JSON.stringify(payload));

    // Support both direct client/server invocation and Supabase database webhook record format
    const record = payload.record || payload;
    const userId = record.user_id || payload.user_id;
    const title = record.title || payload.title || 'Along';
    const body = record.body || payload.body || '';
    const extraData = record.data || payload.data || { reference_id: record.reference_id, type: record.type };

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the recipient profile's push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found', details: profileError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const pushToken = profile.push_token;
    if (!pushToken || typeof pushToken !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'User has no registered push token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Validate Expo Push Token format
    const isExpoToken = pushToken.startsWith('ExponentPushToken[') || pushToken.startsWith('ExpoPushToken[');
    if (!isExpoToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid push token format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: extraData,
      priority: 'high',
      channelId: 'along-default',
    };

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const expoData = await expoResponse.json();
    console.log('[send-push-notification] Expo Push response:', JSON.stringify(expoData));

    return new Response(JSON.stringify({ success: true, data: expoData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[send-push-notification] Uncaught error:', err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
