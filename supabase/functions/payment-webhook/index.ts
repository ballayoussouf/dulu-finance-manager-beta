import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PawaPayWebhookPayload {
  depositId: string
  status: 'COMPLETED' | 'FAILED' | 'REJECTED'
  requestedAmount: string
  currency: string
  correspondent: string
  payer: {
    type: 'MSISDN'
    address: {
      value: string
    }
  }
  depositedAmount?: string
  correspondentIds?: Record<string, string>
  created: string
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
    console.log('Payment webhook received:', req.method)

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse webhook payload
    const payload: PawaPayWebhookPayload = await req.json()
    console.log('Webhook payload:', payload)

    const { depositId, status, depositedAmount, correspondentIds, rejectionReason } = payload

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the payment record by transaction_id (depositId)
    const { data: paymentRecord, error: findError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('transaction_id', depositId)
      .single()

    if (findError || !paymentRecord) {
      console.error('Payment record not found:', findError)
      throw new Error(`Payment record not found for depositId: ${depositId}`)
    }

    console.log('Found payment record:', paymentRecord.id)

    // Determine new status and subscription dates
    let newStatus: string
    let subscriptionStartDate: string | null = null
    let subscriptionEndDate: string | null = null

    switch (status) {
      case 'COMPLETED':
        newStatus = 'completed'
        
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
        const isExtension = paymentRecord.metadata?.is_extension === true
        
        if (isExtension) {
          console.log('Processing subscription extension...')
          
          // Récupérer les informations actuelles de l'utilisateur
          const { data: userData, error: userFetchError } = await supabaseClient
            .from('users')
            .select('subscription_level, subscription_end_date')
            .eq('id', paymentRecord.user_id)
            .single()
            
          if (userFetchError) {
            console.error('Failed to fetch user data for extension:', userFetchError)
          } else {
            // Calculer la nouvelle date de fin d'abonnement
            let newEndDate: Date
            
            if (userData.subscription_end_date) {
              // Si l'utilisateur a déjà une date de fin, ajouter 1 mois à cette date
              const currentEndDate = new Date(userData.subscription_end_date)
              newEndDate = new Date(currentEndDate)
              newEndDate.setMonth(newEndDate.getMonth() + 1)
            } else {
              // Si pas de date de fin existante, créer une nouvelle date à +1 mois
              newEndDate = new Date()
              newEndDate.setMonth(newEndDate.getMonth() + 1)
            }
            
            subscriptionStartDate = new Date().toISOString()
            subscriptionEndDate = newEndDate.toISOString()
            
            // Mettre à jour l'utilisateur avec la nouvelle date de fin
            const { error: userUpdateError } = await supabaseClient
              .from('users')
              .update({
                subscription_level: 'pro', // Assurer que le niveau est 'pro'
                subscription_end_date: newEndDate.toISOString().split('T')[0], // Format date seulement
                updated_at: new Date().toISOString()
              })
              .eq('id', paymentRecord.user_id)
              
            if (userUpdateError) {
              console.error('Failed to extend user subscription:', userUpdateError)
            } else {
              console.log('✅ User subscription successfully extended by 1 month')
            }
          }
        } else {
          // Cas normal - nouvel abonnement
          subscriptionStartDate = new Date().toISOString()
          // Set subscription end date based on plan (assuming monthly plans)
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 1)
          subscriptionEndDate = endDate.toISOString()
          
          // Update user subscription level and dates
          const { error: userUpdateError } = await supabaseClient
            .from('users')
            .update({
              subscription_level: 'pro', // Toujours passer à 'pro' car on n'a que 2 plans maintenant
              subscription_end_date: subscriptionEndDate.split('T')[0], // Format date seulement (YYYY-MM-DD)
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentRecord.user_id)

          if (userUpdateError) {
            console.error('Failed to update user subscription:', userUpdateError)
            // Don't throw error here as payment was successful
          } else {
            console.log('User subscription updated successfully to Pro level')
          }
        }
        break

      case 'FAILED':
        newStatus = 'failed'
        break

      case 'REJECTED':
        newStatus = 'failed'
        break

      default:
        newStatus = status.toLowerCase()
    }

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: newStatus,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate,
        metadata: {
          ...paymentRecord.metadata,
          webhook_payload: payload,
          deposited_amount: depositedAmount,
          correspondent_ids: correspondentIds,
          rejection_reason: rejectionReason,
          webhook_received_at: new Date().toISOString()
        }
      })
      .eq('id', paymentRecord.id)

    if (updateError) {
      console.error('Failed to update payment record:', updateError)
      throw new Error('Failed to update payment record')
    }

    // Log the webhook for audit purposes (optional separate table)
    try {
      await supabaseClient
        .from('payment_webhooks')
        .insert({
          payment_id: paymentRecord.id,
          deposit_id: depositId,
          status,
          payload: payload,
          processed_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log webhook (non-critical):', logError)
      // Don't fail the webhook processing for logging errors
    }

    // Return success response to PawaPay
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed successfully',
      paymentId: paymentRecord.id,
      newStatus,
      userSubscriptionUpdated: status === 'COMPLETED'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Webhook processing failed'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500
    })
  }
})