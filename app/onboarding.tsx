// app/onboarding.tsx

import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { getLocalOnlyMode, getLocalUser, setLocalUser } from "@/shared/utils/localStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SlideData = {
  id: number;
  image?: number;
  title: string;
  subtitle?: string;
  bullets?: string[];
};

const slides: SlideData[] = [
  {
    id: 1,
    image: require("../assets/images/calm.png"),
    title: "A calmer way to keep what matters.",
    subtitle:
      "LifeVault helps you organize important information for the people and pets you care for — so it’s ready when you need it most.\n\nNo clutter. No noise. Just clarity.",
  },
  {
    id: 2,
    image: require("../assets/images/privacy.png"),
    title: "Privacy & Storage",
    subtitle:
      "Your information stays with you.\n\nIf you use iCloud device backup, your information will be restored automatically when you get a new phone.",

  },
  {
    id: 3,
    image: require("../assets/images/control.png"),
    title: "Control & Sharing\nYour information stays with you.",
    subtitle: "Share or print information only when you choose.\n\nSensitive notes are kept private by default and are never included unless you explicitly allow it.\n\nYou’re always in control.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const completing = false;

  const handleContinue = async () => {
    // not last slide → advance
    if (currentSlide < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * SCREEN_WIDTH,
        animated: true,
      });
      return;
    }

    // last slide → mark onboarding complete + go to primary setup
    try {
      const localOnly = await getLocalOnlyMode();
      if (localOnly) {
        const current = await getLocalUser();
        await setLocalUser({
          id: current?.id || `local-${Date.now()}`,
          email: current?.email || "",
          firstName: current?.firstName || "",
          lastName: current?.lastName || "",
          preferredName: current?.preferredName || "",
          hasOnboarded: true,
        });
      }

      router.replace({ pathname: "/(vault)/people/add", params: { primary: "true" } });
    } catch {
      await Promise.allSettled([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
      ]);

      Alert.alert("Session expired", "Please sign in again.");
      router.replace("/");
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
            {slide.image ? (
              <Image
                source={slide.image}
                className="w-64 h-64 rounded-3xl mb-12"
                resizeMode="cover"
              />
            ) : null}

            <Text className="text-3xl font-bold text-foreground text-center mb-8 px-4">
              {slide.title}
            </Text>

            {slide.subtitle ? (
              <Text className="text-base text-muted-foreground text-center leading-relaxed mb-8 px-6">
                {slide.subtitle}
              </Text>
            ) : null}

            {slide.bullets ? (
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
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View className="flex-row justify-center gap-2 mb-6">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"}`}
          />
        ))}
      </View>

      {/* Actions */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={async () => {
            await SecureStore.setItemAsync("skipOnboarding", "true");
            router.replace({ pathname: "/(vault)/people/add", params: { primary: "true" } });
          }}
          className="items-center mb-4"
          activeOpacity={0.8}
        >
          <Text className="text-primary font-semibold">Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={completing}
          className="bg-primary rounded-2xl py-4 px-6 flex-row items-center justify-between"
          activeOpacity={0.8}
          style={{ opacity: completing ? 0.7 : 1 }}
        >
          <Text className="text-primary-foreground text-lg font-semibold flex-1 text-center">
            {currentSlide === slides.length - 1 ? (completing ? "Finishing…" : "Get Started") : "Continue"}
          </Text>
          <ChevronRight size={24} className="text-primary-foreground" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
