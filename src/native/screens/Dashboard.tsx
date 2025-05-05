import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import MainLayout from '../components/layout/MainLayout';
import GreetingBanner from '../components/dashboard/GreetingBanner';
import ChoreList from '../components/dashboard/ChoreList';
import PointsSummary from '../components/dashboard/PointsSummary';
import QuickLinks from '../components/dashboard/QuickLinks';
import { useUser } from '../contexts/UserContext';

export default function Dashboard() {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <MainLayout>
      <ScrollView style={styles.container}>
        <GreetingBanner />
        
        {!isAdmin && (
          <>
            <ChoreList />
            <PointsSummary />
          </>
        )}
        
        <QuickLinks />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 