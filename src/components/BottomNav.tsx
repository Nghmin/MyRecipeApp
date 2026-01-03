import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Home, User, ChefHat } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';




interface BottomNavProps {
  activeTab: 'Home' | 'My Recipe' | 'Account';
  onTabChange: (tab: 'Home' | 'My Recipe' | 'Account') => void;
}

function Snowflake({ delay, left }: { delay: number; left: string }) {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hiệu ứng rơi từ trên xuống
    const fallAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fallAnim, {
          toValue: 120, 
          duration: 4000 + Math.random() * 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Hiệu ứng lắc lư ngang 
    const shakeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 1000 + Math.random() * 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 1000 + Math.random() * 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    fallAnimation.start();
    shakeAnimation.start();

    // Cleanup khi component bị hủy để tránh tốn tài nguyên
    return () => {
      fallAnimation.stop();
      shakeAnimation.stop();
    };
  }, [delay, fallAnim, shakeAnim]);

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          left: left as any, 
          transform: [{ translateY: fallAnim }, { translateX: shakeAnim }],
        },
      ]}
    >
      <Text style={{ color: 'white', fontSize: 10 }}>❄️</Text>
    </Animated.View>
  );
}


export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  // Dữ liệu bông tuyết rơi
  const snowflakes = [
    { delay: 0, left: '10%' },
    { delay: 500, left: '25%' },
    { delay: 1200, left: '40%' },
    { delay: 1800, left: '55%' },
    { delay: 2500, left: '70%' },
    { delay: 800, left: '85%' },
  ];
  // Định nghĩa các Tab
  const tabs = [
    { id: 'Home', label: 'Trang chủ', icon: Home,  color: '#F97316' },
    { id: 'My Recipe', label: 'Công thức', icon: ChefHat, color: '#F97316' },
    { id: 'Account', label: 'Tài khoản', icon: User, color: '#F97316' },
  ];

  return (
    <View style={styles.container}>
      {/* Nền Gradient Giáng Sinh */}
      <LinearGradient
        colors={['#E0F2F7', '#B2D8E5']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBg}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {snowflakes.map((s, i) => (
          <Snowflake key={i} delay={s.delay} left={s.left} />
        ))}
      </View>

      <View style={styles.navContent}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id as any)}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              {/* Chỉ báo Tab đang hoạt động */}
              {isActive && (
                <View style={styles.activeIndicator}>
                  <View style={[styles.activeLine, { backgroundColor: tab.color }]} />
                </View>
              )}

              {/* Icon tab */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isActive ? tab.color : 'rgba(245, 108, 3, 0.33)' },
                ]}
              >
                <IconComponent
                  size={20}
                  color={isActive ? 'white' : 'black'}
                  strokeWidth={2.5}
                />
              </View>

              {/* Tên Tab */}
              <Text style={[styles.label, { color: isActive ? '#fa9e15ff' : 'black' }]}>
                {isActive ? tab.label : `${tab.label}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 15,
    left: 8,
    right: 8, 
    height: 70, 
    borderRadius: 15, 
    overflow: 'hidden',
    
    elevation: 15,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: '#fa9e15ff',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  snowflake: {
    position: 'absolute',
    top: -10,
    zIndex: 1,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%', 
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    padding: 8,
    borderRadius: 12,
    
  },
  label: {
    fontSize: 9, 
    fontWeight: '800',
    marginTop: 1,
  },
  activeIndicator: {
    position: 'absolute',
    top: -12, 
    alignItems: 'center',
  },
  activeLine: {
    width: 30,
    height: 2,
    borderRadius: 2,
  },
  
  bottomBorder: {
    display: 'none',
  },
});