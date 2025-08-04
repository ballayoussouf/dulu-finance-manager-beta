// Service PawaPay pour l'intégration des paiements mobile money
import { Platform } from 'react-native';

export interface PawaPayConfig {
  apiToken: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface PayoutRequest {
  payoutId: string;
  amount: string;
  currency: string;
  country: string;
  correspondent: string;
  recipient: {
    type: 'MSISDN';
    address: {
      value: string;
    };
  };
  customerTimestamp: string;
  statementDescription: string;
}

export interface DepositRequest {
  depositId: string;
  amount: string;
  currency: string;
  correspondent: string;
  payer: {
    type: 'MSISDN';
    address: {
      value: string;
    };
  };
  customerTimestamp: string;
  statementDescription: string;
}

export interface PaymentResponse {
  depositId?: string;
  payoutId?: string;
  status: 'ACCEPTED' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  created: string;
  reason?: string;
  depositedAmount?: string;
  paidAmount?: string;
  correspondentIds?: Record<string, string>;
}

export interface Correspondent {
  correspondent: string;
  country: string;
  currency: string;
  name: string;
}

export class PawaPayService {
  private config: PawaPayConfig;

  constructor(config: PawaPayConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Initier un dépôt (collecte d'argent depuis un portefeuille mobile)
   */
  async initiateDeposit(request: {
    amount: number;
    phoneNumber: string;
    correspondent: string;
    description: string;
  }): Promise<PaymentResponse> {
    try {
      const depositRequest: DepositRequest = {
        depositId: this.generateUUID(),
        amount: request.amount.toString(),
        currency: 'XAF', // Franc CFA pour le Cameroun
        correspondent: request.correspondent,
        payer: {
          type: 'MSISDN',
          address: {
            value: request.phoneNumber.replace('+', ''),
          },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: request.description.substring(0, 22), // Max 22 caractères
      };

      console.log('Initiating deposit:', depositRequest);

      const response = await fetch(`${this.config.baseUrl}/deposits`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(depositRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PawaPay deposit error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Deposit response:', data);
      
      return data;
    } catch (error) {
      console.error('PawaPay deposit error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to initiate deposit');
    }
  }

  /**
   * Vérifier le statut d'un dépôt
   */
  async checkDepositStatus(depositId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/deposits/${depositId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PawaPay status check error:', error);
      throw new Error('Failed to check deposit status');
    }
  }

  /**
   * Obtenir la liste des correspondants disponibles
   */
  async getAvailableCorrespondents(): Promise<Correspondent[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/active-conf`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.correspondents || [];
    } catch (error) {
      console.error('PawaPay correspondents error:', error);
      return [];
    }
  }

  /**
   * Prédire le correspondant pour un numéro de téléphone
   */
  async predictCorrespondent(phoneNumber: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/predict-correspondent`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          msisdn: phoneNumber.replace('+', ''),
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.correspondent || null;
    } catch (error) {
      console.error('PawaPay predict correspondent error:', error);
      return null;
    }
  }
}

// Factory pour créer le service PawaPay
export const createPawaPayService = (): PawaPayService => {
  const environment = (process.env.EXPO_PUBLIC_PAWAPAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
  
  const config: PawaPayConfig = {
    apiToken: process.env.EXPO_PUBLIC_PAWAPAY_API_TOKEN || '',
    baseUrl: environment === 'sandbox' 
      ? 'https://api.sandbox.pawapay.io' 
      : 'https://api.pawapay.io',
    environment,
  };

  if (!config.apiToken) {
    throw new Error('PawaPay API token is required. Please set EXPO_PUBLIC_PAWAPAY_API_TOKEN in your .env file.');
  }

  return new PawaPayService(config);
};

// Correspondants disponibles pour le Cameroun - CODES CORRECTS
export const CAMEROON_CORRESPONDENTS = {
  ORANGE_CMR: 'Orange Money Cameroun',
  MTN_MOMO_CMR: 'MTN Mobile Money Cameroun',
};

// Utilitaires de validation
export const validateCameroonPhoneNumber = (phone: string): boolean => {
  // Format: +237XXXXXXXXX (9 chiffres après +237)
  const pattern = /^\+237[0-9]{9}$/;
  return pattern.test(phone);
};

export const formatCameroonPhoneNumber = (phone: string): string => {
  // Nettoyer et formater le numéro
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('237')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.length === 9) {
    return `+237${cleaned}`;
  }
  
  throw new Error('Invalid Cameroon phone number format');
};

export const getCorrespondentFromPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('237') ? cleaned.substring(3) : cleaned;
  
  // Logique de détection basée sur les préfixes des opérateurs camerounais
  // Orange: 69, 65, 66
  if (number.startsWith('69') || number.startsWith('65') || number.startsWith('66')) {
    return 'ORANGE_CMR';
  } 
  // MTN: 67, 68, 65 (65 peut être partagé)
  else if (number.startsWith('67') || number.startsWith('68')) {
    return 'MTN_MOMO_CMR';
  }
  // Pour 65, on peut essayer Orange en premier
  else if (number.startsWith('65')) {
    return 'ORANGE_CMR';
  }
  
  // Par défaut, retourner Orange Money
  return 'ORANGE_CMR';
};

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};