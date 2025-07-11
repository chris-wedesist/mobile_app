import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '@/components/StealthModeManager';
import { useStealthAutoTimeout } from '@/hooks/useStealthAutoTimeout';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type Event = {
  id: string;
  title: string;
  time: string;
  location?: string;
  type: 'work' | 'personal' | 'meeting' | 'other';
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    time: '10:00 AM',
    location: 'Conference Room A',
    type: 'meeting'
  },
  {
    id: '2',
    title: 'Lunch with Sarah',
    time: '12:30 PM',
    location: 'Cafe Downtown',
    type: 'personal'
  },
  {
    id: '3',
    title: 'Project Review',
    time: '2:00 PM',
    type: 'work'
  },
  {
    id: '4',
    title: 'Gym Session',
    time: '5:30 PM',
    location: 'Fitness Center',
    type: 'personal'
  }
];

export default function StealthCalendarScreen() {
  const { deactivate } = useStealthMode();
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  useStealthAutoTimeout(10);

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() &&
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'work':
        return colors.status.error;
      case 'personal':
        return colors.status.success;
      case 'meeting':
        return colors.accent;
      default:
        return colors.text.muted;
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <LongPressGestureHandler
        minDurationMs={3000}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 4) { // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.container}>
          {/* Calendar Header */}
          <View style={styles.header}>
            <View style={styles.monthSelector}>
              <TouchableOpacity style={styles.monthButton}>
                <MaterialIcons name="chevron-left" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <View style={styles.monthDisplay}>
                <Text style={styles.monthText}>
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
              </View>
              <TouchableOpacity style={styles.monthButton}>
                <MaterialIcons name="chevron-right" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendar}>
            {/* Weekday Headers */}
            <View style={styles.weekdays}>
              {WEEKDAYS.map(day => (
                <View key={day} style={styles.weekday}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.days}>
              {generateCalendarDays().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.day,
                    ...(day && isToday(day) ? [styles.today] : []),
                    ...(day && isSelected(day) ? [styles.selected] : []),
                  ]}
                  onPress={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}>
                  {day && (
                    <>
                      <Text style={[
                        styles.dayText,
                        isToday(day) && styles.todayText,
                        isSelected(day) && styles.selectedText,
                      ]}>
                        {day}
                      </Text>
                      {day === selectedDate.getDate() && (
                        <View style={styles.eventDots}>
                          {[...Array(3)].map((_, i) => (
                            <View key={i} style={styles.eventDot} />
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Events List */}
          <View style={styles.eventsContainer}>
            <Text style={styles.eventsTitle}>
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Text>
            <ScrollView style={styles.eventsList}>
              {SAMPLE_EVENTS.map(event => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventType, { backgroundColor: getEventTypeColor(event.type) }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <MaterialIcons name="schedule" size={16} color={colors.text.muted} />
                        <Text style={styles.eventDetailText}>{event.time}</Text>
                      </View>
                      {event.location && (
                        <View style={styles.eventDetail}>
                          <MaterialIcons name="location-on" size={16} color={colors.text.muted} />
                          <Text style={styles.eventDetailText}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthButton: {
    padding: 8,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
  },
  monthDisplay: {
    paddingHorizontal: 10,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  calendar: {
    padding: 10,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekday: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  dayText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  today: {
    backgroundColor: `${colors.accent}20`,
    borderRadius: radius.lg,
  },
  todayText: {
    color: colors.accent,
    fontWeight: '600',
  },
  selected: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
  },
  selectedText: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.primary,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    ...shadows.lg,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    marginBottom: 15,
    overflow: 'hidden',
    ...shadows.sm,
  },
  eventType: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 15,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.text.muted,
  },
});