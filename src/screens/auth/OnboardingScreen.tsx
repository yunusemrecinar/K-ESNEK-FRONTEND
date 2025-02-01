import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const onboardingData = [
  {
    id: '1',
    title: 'Find Your Dream Job',
    description: 'Discover thousands of job opportunities with all the information you need.',
    icon: 'briefcase-search',
    color: '#6C63FF',
  },
  {
    id: '2',
    title: 'Perfect Match',
    description: 'Find the perfect match for your skills and experience level.',
    icon: 'handshake',
    color: '#4CAF50',
  },
  {
    id: '3',
    title: 'Easy Apply',
    description: 'Apply to jobs with a single click and track your applications.',
    icon: 'rocket-launch',
    color: '#FF9800',
  },
  {
    id: '4',
    title: 'Get Started',
    description: 'Create your profile and start your journey to your dream job.',
    icon: 'flag-checkered',
    color: '#2196F3',
  },
];

const OnboardingScreen = ({ navigation }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('AuthSelection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flatListContainer}>
        <FlatList
          data={onboardingData}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={[styles.illustration, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={120}
                  color={item.color}
                  style={styles.illustrationIcon}
                />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                {item.title}
              </Text>
              <Text variant="bodyLarge" style={styles.description}>
                {item.description}
              </Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {onboardingData.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 16, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: ['#ccc', onboardingData[index].color, '#ccc'],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor },
                ]}
                key={index}
              />
            );
          })}
        </View>

        <Button
          mode="contained"
          onPress={scrollTo}
          style={[styles.button, { backgroundColor: onboardingData[currentIndex].color }]}
        >
          {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatListContainer: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  illustration: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationIcon: {
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen; 