import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PawaPayStatusResponse {
  depositId: string
  status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'FAILED'
  created: string
  reason?: string
  depositedAmount?: string
  correspondentIds?: Record<string, string>
  respondedByPayer?: string
  rejectionReason?: {
    rejectionCode: string
    rejectionMessage: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Payment status check request received:', req.method)

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const body = await req.json()
    console.log('Status check request body:', body)

    const { depositId } = body

    // Validate required fields
    if (!depositId) {
      throw new Error('Missing required field: depositId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First check our database for the payment status
    const { data: paymentRecord, error: dbError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('transaction_id', depositId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // Get PawaPay configuration from environment
    const pawaPayToken = Deno.env.get('PAWAPAY_API_TOKEN')
    const pawaPayBaseUrl = Deno.env.get('PAWAPAY_BASE_URL') || 'https://api.sandbox.pawapay.io'

    if (!pawaPayToken) {
      throw new Error('PawaPay API token not configured')
    }

    console.log('Checking status for deposit:', depositId)
    console.log('Using PawaPay URL:', `${pawaPayBaseUrl}/deposits/${depositId}`)

    // Call PawaPay status API
    const pawaPayResponse = await fetch(`${pawaPayBaseUrl}/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pawaPayToken}`,
        'Content-Type': 'application/json',
      }
    })

    console.log('PawaPay status response status:', pawaPayResponse.status)

    if (!pawaPayResponse.ok) {
      const errorText = await pawaPayResponse.text()
      console.error('PawaPay status error response:', errorText)
      throw new Error(`PawaPay status API error: ${pawaPayResponse.status} - ${errorText}`)
    }

    const pawaPayRawData = await pawaPayResponse.json()
    console.log('PawaPay raw response:', JSON.stringify(pawaPayRawData, null, 2))

    // Handle both array and object responses from PawaPay
    let pawaPayData: PawaPayStatusResponse

    if (Array.isArray(pawaPayRawData)) {
      console.log('📋 PawaPay returned an array, taking first element')
      if (pawaPayRawData.length === 0) {
        throw new Error('PawaPay returned empty array')
      }
      pawaPayData = pawaPayRawData[0]
    } else {
      console.log('📋 PawaPay returned an object directly')
      pawaPayData = pawaPayRawData
    }

    console.log('Processed PawaPay data:', JSON.stringify(pawaPayData, null, 2))

    // Update our database if the status has changed
    let userSubscriptionUpdated = false
    if (paymentRecord && pawaPayData.status) {
      const currentDbStatus = paymentRecord.status
      const pawaPayStatus = pawaPayData.status.toLowerCase()
      
      // Map PawaPay status to our database status
      let newDbStatus = pawaPayStatus
      if (pawaPayData.status === 'ACCEPTED') newDbStatus = 'processing'
      if (pawaPayData.status === 'COMPLETED') newDbStatus = 'completed'
      if (pawaPayData.status === 'FAILED' || pawaPayData.status === 'REJECTED') newDbStatus = 'failed'

      if (currentDbStatus !== newDbStatus) {
        console.log(`Updating payment status from ${currentDbStatus} to ${newDbStatus}`)
        
        const updateData: any = {
          status: newDbStatus,
          metadata: {
            ...paymentRecord.metadata,
            latest_pawapay_status: pawaPayData,
            status_updated_at: new Date().toISOString()
          }
        }

        // If payment completed, set subscription dates
        if (newDbStatus === 'completed') {
          // Créer une transaction de dépense pour le paiement
          try {
            const { error: transactionError } = await supabaseClient
              .from('transactions')
              .insert([
                {
                  user_id: paymentRecord.user_id,
                  amount: parseFloat(paymentRecord.amount),
                  is_expense: true,
                  category_id: '607d224f-f9ee-44c1-9edf-118d73142ee2', // ID de la catégorie spécifiée
                  description: `Abonnement ${paymentRecord.plan_id}${paymentRecord.metadata?.is_extension ? ' (Extension)' : ''}`,
                  transaction_date: new Date().toISOString(),
                },
              ]);

            if (transactionError) {
              console.error('Error recording payment transaction:', transactionError);
            } else {
              console.log('Payment recorded as transaction successfully');
            }
          } catch (transactionRecordError) {
            console.error('Failed to record payment as transaction:', transactionRecordError);
          }
          
          // Vérifier si c'est une extension d'abonnement
          const isExtension = paymentRecord.metadata?.is_extension === true;
          
          if (isExtension) {
            console.log('🔄 Processing subscription extension...');
            
            // Récupérer les informations actuelles de l'utilisateur
            const { data: userData, error: userFetchError } = await supabaseClient
              .from('users')
              .select('subscription_level, subscription_end_date')
              .eq('id', paymentRecord.user_id)
              .single();
              
            if (userFetchError) {
              console.error('Failed to fetch user data for extension:', userFetchError);
            } else {
              // Calculer la nouvelle date de fin d'abonnement
              let newEndDate: Date;
              
              if (userData.subscription_end_date) {
                // Si l'utilisateur a déjà une date de fin, ajouter 1 mois à cette date
                const currentEndDate = new Date(userData.subscription_end_date);
                newEndDate = new Date(currentEndDate);
                newEndDate.setMonth(newEndDate.getMonth() + 1);
              } else {
                // Si pas de date de fin existante, créer une nouvelle date à +1 mois
                newEndDate = new Date();
                newEndDate.setMonth(newEndDate.getMonth() + 1);
              }
              
              // Mettre à jour l'utilisateur avec la nouvelle date de fin
              const { error: userUpdateError } = await supabaseClient
                .from('users')
                .update({
                  subscription_level: 'pro', // Assurer que le niveau est 'pro'
                  subscription_end_date: newEndDate.toISOString().split('T')[0], // Format date seulement
                  updated_at: new Date().toISOString()
                })
                .eq('id', paymentRecord.user_id);
                
              if (userUpdateError) {
                console.error('Failed to extend user subscription:', userUpdateError);
              } else {
                console.log('✅ User subscription successfully extended by 1 month');
                userSubscriptionUpdated = true;
                
                // Mettre à jour les dates dans l'enregistrement de paiement
                updateData.subscription_start_date = new Date().toISOString();
                updateData.subscription_end_date = newEndDate.toISOString();
              }
            }
          } else {
            // Cas normal - nouvel abonnement
            updateData.subscription_start_date = new Date().toISOString();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            updateData.subscription_end_date = endDate.toISOString();

            // Also update user subscription - MISE À JOUR AUTOMATIQUE
            const { error: userUpdateError } = await supabaseClient
              .from('users')
              .update({
                subscription_level: 'pro', // Toujours passer à 'pro'
                subscription_end_date: endDate.toISOString().split('T')[0], // Format date seulement
                updated_at: new Date().toISOString()
              })
              .eq('id', paymentRecord.user_id);

            if (userUpdateError) {
              console.error('Failed to update user subscription:', userUpdateError);
            } else {
              console.log('✅ User subscription automatically updated to Pro level');
              userSubscriptionUpdated = true;
            }
          }
        }

        await supabaseClient
          .from('payments')
          .update(updateData)
          .eq('id', paymentRecord.id);
      }
    }

    // Ensure we always return a valid status
    const status = pawaPayData.status || 'ACCEPTED';
    console.log('Final status to return:', status);

    // Return status response with all relevant data
    return new Response(JSON.stringify({
      success: true,
      depositId: pawaPayData.depositId,
      status: status,
      message: pawaPayData.reason || pawaPayData.rejectionReason?.rejectionMessage || 'Status retrieved successfully',
      depositedAmount: pawaPayData.depositedAmount,
      correspondentIds: pawaPayData.correspondentIds,
      respondedByPayer: pawaPayData.respondedByPayer,
      created: pawaPayData.created,
      rejectionReason: pawaPayData.rejectionReason,
      // Include database info if available
      paymentRecord: paymentRecord ? {
        id: paymentRecord.id,
        status: paymentRecord.status,
        plan_id: paymentRecord.plan_id,
        amount: paymentRecord.amount,
        isExtension: paymentRecord.metadata?.is_extension
      } : null,
      userSubscriptionUpdated
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200
    });

  } catch (error) {
    console.error('Payment status function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Status check failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500
    });
  }
});