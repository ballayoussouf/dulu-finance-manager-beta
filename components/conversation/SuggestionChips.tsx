import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={styles.chip}
          onPress={() => onSelect(suggestion)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
  },
  chip: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    marginRight: Layout.spacing.s,
  },
  chipText: {
    color: Colors.primary[700],
    fontSize: 14,
  },
});