import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-web';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  showDate?: boolean;
}

export default function ChatBubble({ message, showDate }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  return (
    <>
      {showDate && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(message.timestamp)}</Text>
        </View>
      )}
      <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
            {message.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: Layout.spacing.xs,
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  bubble: {
    borderRadius: Layout.borderRadius.large,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary[500],
  },
  assistantBubble: {
    backgroundColor: Colors.gray[200],
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.gray[800],
  },
  timestamp: {
    fontSize: 12,
    color: Colors.gray[500],
    marginHorizontal: Layout.spacing.xs,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: Layout.spacing.m,
  },
  dateText: {
    fontSize: 14,
    color: Colors.gray[600],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
  },
});