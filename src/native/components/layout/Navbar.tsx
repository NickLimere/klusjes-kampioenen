import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Home, Calendar, Gift, User, Settings } from 'lucide-react-native';
import { useUser } from '../../contexts/UserContext';
import { Text } from 'react-native-paper';

export default function Navbar() {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { name: 'Home', path: 'Dashboard', icon: Home },
    { name: 'History', path: 'History', icon: Calendar },
    { name: 'Rewards', path: 'Rewards', icon: Gift },
    { name: 'Profile', path: 'Profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: 'Admin', icon: Settings });
  }

  return (
    <View style={styles.navbar}>
      <View style={styles.navItems}>
        {navItems.map((item) => {
          const isActive = route.name === item.path;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigation.navigate(item.path as never)}
              style={[styles.navItem, isActive && styles.activeNavItem]}
            >
              <item.icon size={20} color={isActive ? '#4F46E5' : '#4B5563'} />
              <Text style={[styles.navText, isActive && styles.activeNavText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: '#EEF2FF',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#4B5563',
  },
  activeNavText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
}); 