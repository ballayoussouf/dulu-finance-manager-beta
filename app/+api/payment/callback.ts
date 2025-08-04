// Webhook pour recevoir les notifications de PawaPay
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('PawaPay callback received:', body);

    // Vérifier la signature du webhook (recommandé en production)
    // const signature = request.headers.get('X-PawaPay-Signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return new Response('Invalid signature', { status: 401 });
    // }

    const { paymentId, status, externalId, amount, currency } = body;

    // Traiter la notification selon le statut
    switch (status) {
      case 'COMPLETED':
        // Paiement réussi - activer l'abonnement
        await handleSuccessfulPayment(externalId, paymentId, amount);
        break;
        
      case 'FAILED':
        // Paiement échoué - notifier l'utilisateur
        await handleFailedPayment(externalId, paymentId);
        break;
        
      case 'PENDING':
      case 'PROCESSING':
        // Paiement en cours - mettre à jour le statut
        await updatePaymentStatus(externalId, status);
        break;
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleSuccessfulPayment(externalId: string, paymentId: string, amount: number) {
  try {
    // Extraire les informations de l'externalId
    const [, planId, userId] = externalId.split('_');
    
    // Mettre à jour l'abonnement de l'utilisateur
    // await updateUserSubscription(userId, planId);
    
    // Envoyer une notification de succès
    // await sendPaymentSuccessNotification(userId, amount);
    
    console.log(`Payment successful for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(externalId: string, paymentId: string) {
  try {
    const [, planId, userId] = externalId.split('_');
    
    // Envoyer une notification d'échec
    // await sendPaymentFailureNotification(userId);
    
    console.log(`Payment failed for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function updatePaymentStatus(externalId: string, status: string) {
  try {
    // Mettre à jour le statut en base de données
    console.log(`Payment status updated: ${externalId} -> ${status}`);
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
}