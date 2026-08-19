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
    console.log('Payload received:', JSON.stringify(payload));

    const { plan_id, user_id } = payload;
    if (!plan_id || !user_id) {
      return new Response('Missing plan_id or user_id', { headers: corsHeaders, status: 400 });
    }

    // Initialize Supabase Client with Service Role Key
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Plan and Host details
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('title, host_id, host:profiles!plans_host_id_fkey(push_token)')
      .eq('id', plan_id)
      .single();

    if (planError || !planData) throw new Error('Failed to find plan/host');

    // Get the joining User's details
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    if (userError || !userData) throw new Error('Failed to find joining user');

    // Don't notify the host if they are the one joining (e.g. initial auto-join on plan creation)
    if (planData.host_id === user_id) {
      return new Response('Host auto-joined, ignoring.', { headers: corsHeaders, status: 200 });
    }

    const hostPushToken = Array.isArray(planData.host) ? planData.host[0]?.push_token : planData.host?.push_token;

    if (!hostPushToken) {
      return new Response('Host has no push token, skipping notification.', { headers: corsHeaders, status: 200 });
    }

    // Send the Push Notification via Expo
    const message = {
      to: hostPushToken,
      sound: 'default',
      title: 'New Join Request!',
      body: `${userData.full_name} wants to join "${planData.title}"!`,
      data: { plan_id: plan_id },
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
    console.log('Expo Push Response:', expoData);

    return new Response(JSON.stringify({ success: true, data: expoData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('Error in notify-host Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
