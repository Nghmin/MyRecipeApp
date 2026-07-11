import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Home, User, ChefHat } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

interface BottomNavProps {
  activeTab: 'Home' | 'My Recipe' | 'Account';
  onTabChange: (tab: 'Home' | 'My Recipe' | 'Account') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { currentTheme } = useTheme();

  const tabs = [
    { id: 'Home', label: 'Trang chủ', icon: Home },
    { id: 'My Recipe', label: 'Công thức', icon: ChefHat },
    { id: 'Account', label: 'Tài khoản', icon: User },
  ];

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(10, 8, 8, 0.43)' }]}>
      <View style={styles.navContent}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id as any)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isActive ? currentTheme.primary : 'rgba(255,255,255,0.5)',
                    borderRadius: 50,
                  },
                
                ]}
              >
                <IconComponent
                  size={24}
                  color={isActive ? 'white' : 'rgba(255,255,255,0.5)'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              <Text style={[
                styles.label,
                {
                  color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                  fontWeight: isActive ? '700' : '500'
                }
              ]}>
                {tab.label}
              </Text>

              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: currentTheme.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 15,
    right: 15,
    height: 70,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(33, 18, 18, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    textShadowRadius: 0, 
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    
  },
});