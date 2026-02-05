import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SlideData = {
  id: number;
  imageUri?: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
};

const slides: SlideData[] = [
  {
    id: 1,
    imageUri: 'https://images.unsplash.com/photo-1635099404457-91c3d0dade3b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8MyUyMGdyYXBoaWNzfGVufDB8fDB8fHww',
    title: 'A calmer way to keep what matters.',
  },
  {
    id: 2,
    title: 'Privacy & Storage',
    bullets: [
      'Stored on your device, protected by Face ID. No accounts. No data selling.',
      'You can restore from iCloud device backup (Apple-managed).',
    ],
  },
  {
    id: 3,
    title: 'Control & Sharing',
    bullets: [
      'Share/print only when you choose.',
      'Sensitive notes are excluded by default.',
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      // Go to next slide
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      // Navigate to Primary Setup Gate
      router.replace('/primary-setup');
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(newIndex);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1"
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 px-6 justify-center items-center"
          >
            {/* Image for Welcome screen */}
            {slide.imageUri && (
              <Image
                source={{ uri: slide.imageUri }}
                className="w-64 h-64 rounded-3xl mb-12"
                resizeMode="cover"
              />
            )}

            {/* Title */}
            <Text className="text-3xl font-bold text-foreground text-center mb-8 px-4">
              {slide.title}
            </Text>

            {/* Bullet points */}
            {slide.bullets && (
              <View className="gap-6 px-4">
                {slide.bullets.map((bullet, index) => (
                  <View key={index} className="flex-row gap-3">
                    <View className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                    <Text className="text-lg text-muted-foreground flex-1 leading-relaxed">
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View className="flex-row justify-center gap-2 mb-6">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted'
            }`}
          />
        ))}
      </View>

      {/* Continue Button */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-primary rounded-2xl py-4 px-6 flex-row items-center justify-between"
          activeOpacity={0.8}
        >
          <Text className="text-primary-foreground text-lg font-semibold flex-1 text-center">
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <ChevronRight size={24} className="text-primary-foreground" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}