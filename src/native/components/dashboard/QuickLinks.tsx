import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Gift, User } from 'lucide-react-native';
import { Text } from 'react-native-paper';

const links = [
  {
    icon: Calendar,
    title: 'View History',
    description: 'See your completed chores',
    path: 'History',
    color: '#FEF3C7', // bg-joy-card-1
  },
  {
    icon: Gift,
    title: 'Rewards Shop',
    description: 'Redeem your points',
    path: 'Rewards',
    color: '#D1FAE5', // bg-joy-card-2
  },
  {
    icon: User,
    title: 'Profile',
    description: 'View your stats',
    path: 'Profile',
    color: '#E0E7FF', // bg-joy-card-4
  },
];

export default function QuickLinks() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {links.map((link) => (
        <TouchableOpacity
          key={link.title}
          onPress={() => navigation.navigate(link.path as never)}
          style={[styles.link, { backgroundColor: link.color }]}
        >
          <View style={styles.iconContainer}>
            <link.icon size={24} color="#4F46E5" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{link.title}</Text>
            <Text style={styles.description}>{link.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  link: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
  },
}); 