import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Navbar from './Navbar';
import UserSwitcher from '../user/UserSwitcher';
import { useUser } from '../../contexts/UserContext';
import { Text } from 'react-native-paper';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { currentUser } = useUser();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Chore Champion</Text>
          <UserSwitcher />
        </View>
      </View>
      
      <Navbar />
      
      <View style={styles.mainContent}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5', // joy-primary color
  },
  mainContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 96, // Space for navbar
  },
}); 