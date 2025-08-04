import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import twilio from 'npm:twilio@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    console.log('Request method:', req.method);
    
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid JSON body');
    }

    // Validate request parameters
    const { to } = body;
    console.log('Phone number received:', to);
    
    if (!to || typeof to !== 'string') {
      throw new Error('Invalid phone number');
    }

    if (!to.startsWith('+')) {
      throw new Error('Phone number must be in international format (+237xxxxxxxxx)');
    }

    // Validate environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    
    console.log('Environment check:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      fromNumber: fromNumber // Temporaire pour debug
    });
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio configuration');
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Format phone numbers for WhatsApp
    const formattedTo = `whatsapp:${to}`;
    const formattedFrom = `whatsapp:${fromNumber}`;

    try {
      console.log('Attempting to send WhatsApp message...');
      console.log('From:', formattedFrom);
      console.log('To:', formattedTo);
      
      // Send WhatsApp message using template
      const message = await client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        contentSid: 'HX65eee0e86d8bc7765b54ef88db9d9bf0', // Votre template SID
        contentVariables: JSON.stringify({
          "1": otp // Le code de vérification pour la variable {{1}}
        })
      });
      
      console.log('Message sent successfully:', message.sid);

      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // Store OTP in database with expiration (15 minutes)
      const { error: dbError } = await supabaseClient
        .from('verification_codes')
        .insert({
          phone: to,
          code: otp,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          channel: 'whatsapp',
          message_sid: message.sid
        });

      if (dbError) {
        console.error('Database Error:', dbError);
        throw new Error('Failed to store verification code');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Code de vérification WhatsApp envoyé avec succès',
        messageId: message.sid,
        code: otp // Pour debug uniquement - retirez en production
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });

    } catch (twilioError) {
      console.error('Twilio Error:', twilioError);
      throw new Error(`Échec de l'envoi du message: ${twilioError.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Une erreur est survenue'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: error.status || 400
    });
  }
});