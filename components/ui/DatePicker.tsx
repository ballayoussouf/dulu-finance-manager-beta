import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DatePickerProps {
  value: string | null;
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onDateChange,
  placeholder = 'Sélectionner une date',
  label,
  disabled = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  // Fonction pour créer une date locale à partir d'une chaîne YYYY-MM-DD
  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 car les mois sont indexés à partir de 0
  };

  // Fonction pour formater une date en chaîne YYYY-MM-DD
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // État pour la navigation du calendrier
  const [calendarDate, setCalendarDate] = useState(() => {
    if (value) {
      return createLocalDate(value);
    }
    return new Date();
  });
  
  // État pour la date sélectionnée temporairement
  const [tempSelectedDate, setTempSelectedDate] = useState(() => {
    if (value) {
      return createLocalDate(value);
    }
    return new Date();
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Générer une liste d'années (de 1900 à l'année actuelle + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => currentYear - i);

  const openPicker = () => {
    // Réinitialiser les états quand on ouvre le picker
    const initialDate = value ? createLocalDate(value) : new Date();
    setCalendarDate(new Date(initialDate));
    setTempSelectedDate(new Date(initialDate));
    setShowPicker(true);
  };

  const handleConfirm = () => {
    const dateString = formatDateToString(tempSelectedDate);
    onDateChange(dateString);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  // Navigation du calendrier
  const goToPreviousMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarDate(newDate);
  };

  // Sélection de mois
  const handleMonthSelect = (monthIndex: number) => {
    const newCalendarDate = new Date(calendarDate);
    newCalendarDate.setMonth(monthIndex);
    setCalendarDate(newCalendarDate);
    
    // Ajuster la date sélectionnée si nécessaire
    const newSelectedDate = new Date(tempSelectedDate);
    newSelectedDate.setFullYear(calendarDate.getFullYear());
    newSelectedDate.setMonth(monthIndex);
    
    // Vérifier si le jour existe dans le nouveau mois
    const lastDayOfMonth = new Date(calendarDate.getFullYear(), monthIndex + 1, 0).getDate();
    if (newSelectedDate.getDate() > lastDayOfMonth) {
      newSelectedDate.setDate(lastDayOfMonth);
    }
    
    setTempSelectedDate(newSelectedDate);
    setShowMonthPicker(false);
  };

  // Sélection d'année
  const handleYearSelect = (year: number) => {
    const newCalendarDate = new Date(calendarDate);
    newCalendarDate.setFullYear(year);
    setCalendarDate(newCalendarDate);
    
    // Ajuster la date sélectionnée si nécessaire
    const newSelectedDate = new Date(tempSelectedDate);
    newSelectedDate.setFullYear(year);
    
    // Vérifier si le jour existe dans la nouvelle année (cas du 29 février)
    const lastDayOfMonth = new Date(year, newSelectedDate.getMonth() + 1, 0).getDate();
    if (newSelectedDate.getDate() > lastDayOfMonth) {
      newSelectedDate.setDate(lastDayOfMonth);
    }
    
    setTempSelectedDate(newSelectedDate);
    setShowYearPicker(false);
  };

  // Sélection de jour
  const handleDaySelect = (date: Date) => {
    setTempSelectedDate(new Date(date));
  };

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer par le dimanche de la semaine contenant le premier jour
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    // Générer 6 semaines (42 jours)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const days = generateCalendarDays();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === tempSelectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === calendarDate.getMonth();
  };

  const MonthPicker = () => (
    <Modal
      visible={showMonthPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMonthPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Sélectionner un mois</Text>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {monthNames.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  calendarDate.getMonth() === index && styles.selectedPickerItem
                ]}
                onPress={() => handleMonthSelect(index)}
              >
                <Text style={[
                  styles.pickerItemText,
                  calendarDate.getMonth() === index && styles.selectedPickerItemText
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.pickerCancelButton}
            onPress={() => setShowMonthPicker(false)}
          >
            <Text style={styles.pickerCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const YearPicker = () => (
    <Modal
      visible={showYearPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowYearPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Sélectionner une année</Text>
          <ScrollView 
            style={styles.pickerList}
            showsVerticalScrollIndicator={true}
          >
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.pickerItem,
                  calendarDate.getFullYear() === year && styles.selectedPickerItem
                ]}
                onPress={() => handleYearSelect(year)}
              >
                <Text style={[
                  styles.pickerItemText,
                  calendarDate.getFullYear() === year && styles.selectedPickerItemText
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.pickerCancelButton}
            onPress={() => setShowYearPicker(false)}
          >
            <Text style={styles.pickerCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CalendarModal = () => (
    <Modal
      visible={showPicker}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Header avec navigation */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={20} color={Colors.gray[700]} />
            </TouchableOpacity>
            
            <View style={styles.monthYearContainer}>
              <TouchableOpacity 
                style={styles.monthYearButton}
                onPress={() => setShowMonthPicker(true)}
              >
                <Text style={styles.monthYearText}>
                  {monthNames[calendarDate.getMonth()]}
                </Text>
                <ChevronDown size={16} color={Colors.gray[600]} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.monthYearButton}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={styles.monthYearText}>
                  {calendarDate.getFullYear()}
                </Text>
                <ChevronDown size={16} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={20} color={Colors.gray[700]} />
            </TouchableOpacity>
          </View>

          {/* Noms des jours */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((day) => (
              <Text key={day} style={styles.dayNameText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Grille du calendrier */}
          <View style={styles.calendarGrid}>
            {days.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  !isCurrentMonth(date) && styles.otherMonthDay,
                  isSelected(date) && styles.selectedDay,
                  isToday(date) && !isSelected(date) && styles.todayDay,
                ]}
                onPress={() => handleDaySelect(date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth(date) && styles.otherMonthDayText,
                    isSelected(date) && styles.selectedDayText,
                    isToday(date) && !isSelected(date) && styles.todayDayText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.calendarActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <MonthPicker />
      <YearPicker />
    </Modal>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.dateButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && openPicker()}
        disabled={disabled}
      >
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDate(createLocalDate(value)) : placeholder}
        </Text>
        <Calendar size={20} color={disabled ? Colors.gray[400] : Colors.gray[600]} />
      </TouchableOpacity>

      <CalendarModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.m,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  disabledButton: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[200],
  },
  dateText: {
    fontSize: 16,
    color: Colors.gray[800],
  },
  placeholderText: {
    color: Colors.gray[400],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    margin: Layout.spacing.l,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 320,
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.xs,
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: Layout.spacing.xs,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  selectedDay: {
    backgroundColor: Colors.primary[500],
  },
  todayDay: {
    backgroundColor: Colors.primary[100],
    borderWidth: 2,
    borderColor: Colors.primary[300],
  },
  dayText: {
    fontSize: 16,
    color: Colors.gray[800],
    fontWeight: '500',
  },
  otherMonthDayText: {
    color: Colors.gray[400],
  },
  selectedDayText: {
    color: Colors.white,
    fontWeight: '600',
  },
  todayDayText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.l,
    gap: Layout.spacing.m,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.gray[700],
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  // Styles pour les sélecteurs de mois/année
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    margin: Layout.spacing.l,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    width: 280,
    maxHeight: 500,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  pickerList: {
    maxHeight: 350,
    marginBottom: Layout.spacing.m,
  },
  pickerItem: {
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.xs,
  },
  selectedPickerItem: {
    backgroundColor: Colors.primary[500],
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.gray[800],
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: Colors.white,
    fontWeight: '600',
  },
  pickerCancelButton: {
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  pickerCancelText: {
    fontSize: 16,
    color: Colors.gray[700],
    fontWeight: '500',
  },
});