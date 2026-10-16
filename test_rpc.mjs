import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = 'https://bahmgqxuxuohaaubrvui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaG1ncXh1eHVvaGFhdWJydnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzgzOTgsImV4cCI6MjEwMTYxNDM5OH0.uIlxlVJRxIlPFs8ucJO3ZeoFwX5IeBXcIbAahrQt8mA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: WebSocket }
});

async function testRPC() {
  console.log('Testing RPC...');
  const { data, error } = await supabase
    .rpc('get_nearby_plans', {
      user_lat: 17.4485835,
      user_lon: 78.3908035,
      query_embedding: undefined,
      match_threshold: 0.5,
      match_count: 50
    });
  
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

testRPC();
