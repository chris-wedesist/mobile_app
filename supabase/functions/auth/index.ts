import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { checkRateLimit } from '../../utils/rateLimit';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, password, ip } = await req.json();
    
    // Use IP address or email as identifier for rate limiting
    const identifier = ip || email || 'anonymous';
    
    // Check rate limit before proceeding
    const allowed = await checkRateLimit(identifier);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts. Please try again later.' 
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Proceed with authentication logic
    // This is where you would call Supabase auth or your own auth system
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});