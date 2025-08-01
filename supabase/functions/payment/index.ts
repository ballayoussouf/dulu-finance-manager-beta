import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DepositRequest {
  depositId: string
  amount: string
  currency: string
  correspondent: string
  payer: {
    type: 'MSISDN'
    address: {
      value: string
    }
  }
  customerTimestamp: string
  statementDescription: string
}

interface PawaPayResponse {
  depositId: string
  status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'FAILED'
  created: string
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Payment request received:', req.method)

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const body = await req.json()
    console.log('Request body:', body)

    const { amount, phoneNumber, correspondent, planId, userId, description, isExtension } = body

    // Validate required fields
    if (!amount || !phoneNumber || !correspondent || !planId || !userId) {
      throw new Error('Missing required fields: amount, phoneNumber, correspondent, planId, userId')
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+237') || phoneNumber.length !== 13) {
      throw new Error('Invalid phone number format. Must be +237XXXXXXXXX')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get PawaPay configuration from environment
    const pawaPayToken = Deno.env.get('PAWAPAY_API_TOKEN')
    const pawaPayBaseUrl = Deno.env.get('PAWAPAY_BASE_URL') || 'https://api.sandbox.pawapay.io'

    if (!pawaPayToken) {
      throw new Error('PawaPay API token not configured')
    }

    console.log('PawaPay config:', {
      hasToken: !!pawaPayToken,
      baseUrl: pawaPayBaseUrl
    })

    // Generate unique deposit ID
    const depositId = crypto.randomUUID()

    // Determine payment method based on correspondent
    const paymentMethod = correspondent === 'ORANGE_CMR' ? 'Orange Money' : 'MTN Money'

    // Create payment record in database with pending status
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        currency: 'XAF',
        status: 'pending',
        payment_method: paymentMethod,
        transaction_id: depositId,
        plan_id: planId,
        metadata: {
          phone_number: phoneNumber,
          correspondent: correspondent,
          description: description || `DULU ${planId}`,
          is_extension: isExtension || false,
          pawapay_request: {
            depositId,
            amount: amount.toString(),
            correspondent,
            payer_phone: phoneNumber
          }
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      throw new Error('Failed to create payment record')
    }

    console.log('Payment record created:', paymentRecord.id)

    // Créer une description compatible avec PawaPay (alphanumériques et espaces uniquement)
    // CORRECTION: Supprimer les parenthèses et autres caractères spéciaux
    let statementDescription = description?.replace(/[^a-zA-Z0-9 ]/g, ' ') || `DULU ${planId}`
    
    // Si c'est une extension, utiliser un format compatible
    if (isExtension) {
      statementDescription = `DULU ${planId} Extension`
    }
    
    // Limiter à 22 caractères maximum
    statementDescription = statementDescription.substring(0, 22)
    
    console.log('Using statement description:', statementDescription)

    // Prepare PawaPay deposit request
    const depositRequest: DepositRequest = {
      depositId,
      amount: amount.toString(),
      currency: 'XAF', // Franc CFA
      correspondent,
      payer: {
        type: 'MSISDN',
        address: {
          value: phoneNumber.replace('+', '') // Remove + for PawaPay
        }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: statementDescription
    }

    console.log('Sending deposit request to PawaPay:', depositRequest)

    // Call PawaPay API
    const pawaPayResponse = await fetch(`${pawaPayBaseUrl}/deposits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pawaPayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(depositRequest)
    })

    console.log('PawaPay response status:', pawaPayResponse.status)

    if (!pawaPayResponse.ok) {
      const errorText = await pawaPayResponse.text()
      console.error('PawaPay error response:', errorText)
      
      // Update payment status to failed
      await supabaseClient
        .from('payments')
        .update({ 
          status: 'failed',
          metadata: {
            ...paymentRecord.metadata,
            error: errorText,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', paymentRecord.id)

      throw new Error(`PawaPay API error: ${pawaPayResponse.status} - ${errorText}`)
    }

    const pawaPayData: PawaPayResponse = await pawaPayResponse.json()
    console.log('PawaPay response data:', pawaPayData)

    // Update payment record with PawaPay response
    const updatedStatus = pawaPayData.status === 'ACCEPTED' ? 'processing' : 
                         pawaPayData.status === 'REJECTED' ? 'failed' : 
                         pawaPayData.status.toLowerCase()

    await supabaseClient
      .from('payments')
      .update({
        status: updatedStatus,
        metadata: {
          ...paymentRecord.metadata,
          pawapay_response: pawaPayData,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', paymentRecord.id)

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentRecord.id,
      depositId: pawaPayData.depositId,
      status: pawaPayData.status,
      message: pawaPayData.reason || 'Deposit initiated successfully',
      created: pawaPayData.created,
      isExtension: isExtension || false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200
    })

  } catch (error) {
    console.error('Payment function error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Payment processing failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500
    })
  }
})