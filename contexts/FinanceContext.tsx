import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Transaction, Category, Budget, FinancialSummary, ChatMessage } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  financialSummary: FinancialSummary;
  chatHistory: ChatMessage[];
  isProcessing: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  addChatMessage: (message: Omit<ChatMessage, 'id'>) => Promise<void>;
  clearChatHistory: () => void;
  refreshData: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshChatHistory: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType>({
  transactions: [],
  categories: [],
  budgets: [],
  financialSummary: {
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
    period: 'month',
  },
  chatHistory: [],
  isProcessing: false,
  isLoading: false,
  lastUpdated: null,
  addTransaction: async () => {},
  deleteTransaction: async () => {},
  updateTransaction: async () => {},
  addChatMessage: async () => {},
  clearChatHistory: () => {},
  refreshData: async () => {},
  refreshTransactions: async () => {},
  refreshCategories: async () => {},
  refreshBudgets: async () => {},
  refreshChatHistory: async () => {},
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { playMessageReceived, playNotification } = useSoundEffects();
  
  // Références pour gérer les subscriptions et timeouts
  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    if (user) {
      refreshData();
      setupRealtimeSubscription();
    }
    
    return () => {
      cleanupSubscriptions();
    };
  }, [user]);

  const cleanupSubscriptions = () => {
    // Nettoyer les timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Nettoyer le channel spécifique
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    }

    // Réinitialiser les tentatives de reconnexion
    reconnectAttemptsRef.current = 0;
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Nettoyer les subscriptions existantes
    cleanupSubscriptions();

    console.log('Setting up realtime subscription for user:', user.id);

    try {
      const channel = supabase
        .channel(`n8n-chat-${user.id}`, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'n8n_chat_histories',
            filter: `session_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime payload received:', payload);
            handleRealtimeMessage(payload);
          }
        )
        .subscribe((status, err) => {
          console.log('Realtime subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('Successfully subscribed to realtime changes');
              reconnectAttemptsRef.current = 0; // Reset counter on successful connection
              break;
              
            case 'CHANNEL_ERROR':
              console.error('Realtime subscription error:', err);
              handleConnectionError();
              break;
              
            case 'TIMED_OUT':
              console.warn('Realtime subscription timed out');
              handleConnectionError();
              break;
              
            case 'CLOSED':
              console.log('Realtime subscription closed');
              break;
              
            default:
              console.log('Realtime subscription status changed:', status);
          }
        });

      channelRef.current = channel;
      
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      handleConnectionError();
    }
  };

  const handleConnectionError = () => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setupRealtimeSubscription();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Stopping realtime subscription.');
      setIsProcessing(false); // Stop processing if we can't reconnect
    }
  };

  const handleRealtimeMessage = async (payload: any) => {
    try {
      const messageData = payload.new?.message;
      
      if (!messageData) {
        console.log('No message data found in payload');
        return;
      }

      console.log('Message type:', messageData.type);
      
      // Vérifier si c'est un message de l'assistant
      if (messageData.type === 'ai') {
        const newMessage: ChatMessage = {
          id: payload.new.id.toString(),
          text: messageData.content,
          sender: 'assistant',
          timestamp: new Date(payload.new.created_at),
        };
        
        console.log('Adding new AI message:', newMessage);
        setChatHistory(prev => [...prev, newMessage]);
        
        // Jouer le son de réception de message
        await playMessageReceived();
        
        // Arrêter le processing
        setIsProcessing(false);
        
        // Nettoyer le timeout de sécurité
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log('Processing stopped for AI message');
      }
    } catch (error) {
      console.error('Error handling realtime message:', error);
    }
  };

  const extractUserMessage = (content: string): string => {
    const messageMatch = content.match(/message:\s*(.*)/);
    return messageMatch ? messageMatch[1].trim() : content;
  };

  // Fonction de rafraîchissement global
  const refreshData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        fetchBudgets(),
        fetchChatHistory(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions de rafraîchissement individuelles
  const refreshTransactions = async () => {
    if (!user) return;
    await fetchTransactions();
    setLastUpdated(new Date());
  };

  const refreshCategories = async () => {
    if (!user) return;
    await fetchCategories();
    setLastUpdated(new Date());
  };

  const refreshBudgets = async () => {
    if (!user) return;
    await fetchBudgets();
    setLastUpdated(new Date());
  };

  const refreshChatHistory = async () => {
    if (!user) return;
    await fetchChatHistory();
    setLastUpdated(new Date());
  };

  const fetchChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .eq('session_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const messages: ChatMessage[] = data.flatMap(item => {
          const messageData = item.message;
          if (!messageData) return [];
          
          const text = messageData.type === 'human' 
            ? extractUserMessage(messageData.content)
            : messageData.content;

          return [{
            id: item.id.toString(),
            text,
            sender: messageData.type === 'human' ? 'user' : 'assistant',
            timestamp: new Date(item.created_at)
          }];
        });

        setChatHistory(messages);
      } else {
        setChatHistory([{
          id: '1',
          text: 'Bonjour ! Je suis DULU, votre assistant financier. Comment puis-je vous aider aujourd\'hui ?',
          sender: 'assistant',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([{
        id: '1',
        text: 'Bonjour ! Je suis DULU, votre assistant financier. Comment puis-je vous aider aujourd\'hui ?',
        sender: 'assistant',
        timestamp: new Date(),
      }]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      setTransactions(
        data.map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.is_expense ? 'expense' : 'income',
          category: t.category_id,
          description: t.description,
          date: new Date(t.transaction_date),
        }))
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(
        data.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon_name || 'circle',
          color: c.color || '#808080',
          type: c.is_expense ? 'expense' : 'income',
        }))
      );
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      setBudgets(
        data.map(b => ({
          id: b.id,
          category: b.category_id,
          amount: b.target_amount,
          spent: b.current_amount,
          period: 'monthly',
        }))
      );
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const calculateFinancialSummary = (): FinancialSummary => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      balance: income - expenses,
      income,
      expenses,
      savings: income - expenses,
      period: 'month',
    };
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user?.id,
            amount: transaction.amount,
            is_expense: transaction.type === 'expense',
            category_id: transaction.category,
            description: transaction.description,
            transaction_date: transaction.date.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [
        {
          id: data.id,
          amount: data.amount,
          type: data.is_expense ? 'expense' : 'income',
          category: data.category_id,
          description: data.description,
          date: new Date(data.transaction_date),
        },
        ...prev,
      ]);
      
      setLastUpdated(new Date());
      
      // Jouer une notification pour la nouvelle transaction
      await playNotification();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: data.amount,
          is_expense: data.type === 'expense',
          category_id: data.category,
          description: data.description,
          transaction_date: data.date?.toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t =>
          t.id === id ? { ...t, ...data } : t
        )
      );
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const addChatMessage = async (message: Omit<ChatMessage, 'id'>): Promise<void> => {
    if (!user) return;

    const newMessage = {
      ...message,
      id: Date.now().toString(),
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    
    if (message.sender === 'user') {
      setIsProcessing(true);
      
      // Timeout de sécurité pour éviter que le bouton reste bloqué
      timeoutRef.current = setTimeout(() => {
        console.log('Timeout reached, stopping processing');
        setIsProcessing(false);
      }, 30000); // 30 secondes
      
      try {
        const webhookResponse = await fetch('https://flowbydulu.duckdns.org/webhook/dc3aa3dd-34c8-47ac-b875-edaa4617a0e6', {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: user.id,
            new_message: message.text
          })
        });

        if (!webhookResponse.ok) {
          throw new Error(`Erreur de connexion: ${webhookResponse.status}`);
        }
        
        console.log('Webhook called successfully');
        
      } catch (error) {
        console.error('Error calling webhook:', error);
        
        // En cas d'erreur, arrêter le processing et nettoyer le timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsProcessing(false);
        
        // Optionnel : ajouter un message d'erreur dans le chat
        setChatHistory(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Désolé, une erreur est survenue. Veuillez vérifier votre connexion et réessayer.',
          sender: 'assistant',
          timestamp: new Date(),
        }]);
        
        // Propager l'erreur pour que l'interface puisse la gérer
        throw error;
      }
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('n8n_chat_histories')
        .delete()
        .eq('session_id', user.id);

      if (error) throw error;

      setChatHistory([{
        id: '1',
        text: 'Bonjour ! Je suis DULU, votre assistant financier. Comment puis-je vous aider aujourd\'hui ?',
        sender: 'assistant',
        timestamp: new Date(),
      }]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        financialSummary: calculateFinancialSummary(),
        chatHistory,
        isProcessing,
        isLoading,
        lastUpdated,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        addChatMessage,
        clearChatHistory,
        refreshData,
        refreshTransactions,
        refreshCategories,
        refreshBudgets,
        refreshChatHistory,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}