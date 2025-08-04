// API Route pour gérer les paiements PawaPay
import { createPawaPayService } from '@/lib/pawapay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, phoneNumber, correspondent, planId, userId, description } = body;

    // Validation des données
    if (!amount || !phoneNumber || !correspondent || !planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialiser le service PawaPay
    const pawaPayService = createPawaPayService('sandbox'); // Utiliser 'production' en live

    // Créer une référence unique pour la transaction
    const externalId = `DULU_${planId}_${userId}_${Date.now()}`;

    // Initier le dépôt avec PawaPay
    const depositResponse = await pawaPayService.initiateDeposit({
      amount: amount,
      phoneNumber: phoneNumber,
      correspondent: correspondent,
      description: description || `DULU ${planId}`,
    });

    // Sauvegarder la transaction en base (optionnel)
    // await savePaymentTransaction({
    //   externalId,
    //   userId,
    //   planId,
    //   amount,
    //   status: depositResponse.status,
    //   depositId: depositResponse.depositId,
    // });

    return new Response(
      JSON.stringify({
        success: true,
        depositId: depositResponse.depositId,
        status: depositResponse.status,
        message: depositResponse.reason || 'Deposit initiated successfully',
        externalId: externalId,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Payment API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Payment processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const depositId = url.searchParams.get('depositId');

    if (!depositId) {
      return new Response(
        JSON.stringify({ error: 'Deposit ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le statut du dépôt
    const pawaPayService = createPawaPayService('sandbox');
    const statusResponse = await pawaPayService.checkDepositStatus(depositId);

    return new Response(
      JSON.stringify({
        success: true,
        depositId: statusResponse.depositId,
        status: statusResponse.status,
        message: statusResponse.reason || 'Status retrieved successfully',
        correspondentIds: statusResponse.correspondentIds,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Payment status check error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}