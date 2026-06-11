import React, { useState, useRef, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  StatusBar, 
  ActivityIndicator, 
  View, 
  Text,
  Platform,
  BackHandler,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  TouchableOpacity
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFonts } from 'expo-font';
import { 
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { handleBridgeMessage } from './src/bridge';

const WEB_APP_URL = 'https://kanangal-app.pages.dev'; 
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Horizontal slider configuration
const SLIDER_WIDTH = SCREEN_WIDTH * 0.82; 
const BUTTON_SIZE = 56;
const TRACK_PADDING = 5;
const MAX_DRAG = SLIDER_WIDTH - BUTTON_SIZE - (TRACK_PADDING * 2); 
const SWIPE_THRESHOLD = MAX_DRAG * 0.75; 

// Kanangal Brand Color
const BRAND_GOLD = '#c5a880'; // Premium warm champagne gold (NEOM/Saudi style)

// Bottom Nav configuration and layout constants matching the Diamond CTA design
const TABS = [
  { id: 'home', icon: 'home', path: '/' },
  { id: 'search', icon: 'search', path: '/search' },
  { id: 'tv', icon: 'tv', path: '/tv', isCTA: true }, // Central elevated Diamond CTA button
  { id: 'notifications', icon: 'bell', path: '/notifications' },
  { id: 'profile', icon: 'user', path: '/profile' }
];
const TAB_BAR_HEIGHT = 75;
const BUBBLE_SIZE = 42; // Diamond CTA size

// Custom line-art SVGs for the tab bar
const renderTabIcon = (id, color = 'rgba(19, 31, 36, 0.54)') => {
  switch (id) {
    case 'home':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
          <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
          <Circle cx={11} cy={11} r={8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'tv':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
          <Rect x={2} y={7} width={20} height={13} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17 2l-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'notifications':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
          <Path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={12} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
};

const renderActiveIcon = (id) => {
  return renderTabIcon(id, BRAND_GOLD);
};

// Marquee Mathematics for seamless loop (adjusted for 3 columns)
const PHOTO_FRAME_HEIGHT = SCREEN_HEIGHT * 0.22; // Resized slightly to fit 3 columns
const ITEM_MARGIN = 20; // 10 top + 10 bottom margin
const ITEM_HEIGHT = PHOTO_FRAME_HEIGHT + ITEM_MARGIN;
const UNIQUE_ITEMS_COUNT = 3;
const TOTAL_SCROLL_DISTANCE = ITEM_HEIGHT * UNIQUE_ITEMS_COUNT; 

// Unique wedding image lists (optimized with smaller dimensions and verified working IDs)
const UNIQUE_PHOTOS_COL1 = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=75', // Wedding laugh (1)
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=75', // Indian wedding couple (2)
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=300&q=75', // Wedding ceremony couple (3)
];

const UNIQUE_PHOTOS_COL2 = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=75', // Dance couple (1)
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=75', // Wedding laugh (2)
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=300&q=75', // Wedding details (3)
];

const UNIQUE_PHOTOS_COL3 = [
  'https://images.unsplash.com/photo-1520854221256-17451cc35953?auto=format&fit=crop&w=300&q=75', // Wedding celebration kiss (1)
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=300&q=75', // Wedding details (2)
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=300&q=75', // Wedding ceremony couple (3)
];

// Repeat lists 5 times to ensure absolutely no empty gaps under any screen height or translation
const MEMORY_PHOTOS_COL1 = [...UNIQUE_PHOTOS_COL1, ...UNIQUE_PHOTOS_COL1, ...UNIQUE_PHOTOS_COL1, ...UNIQUE_PHOTOS_COL1, ...UNIQUE_PHOTOS_COL1];
const MEMORY_PHOTOS_COL2 = [...UNIQUE_PHOTOS_COL2, ...UNIQUE_PHOTOS_COL2, ...UNIQUE_PHOTOS_COL2, ...UNIQUE_PHOTOS_COL2, ...UNIQUE_PHOTOS_COL2];
const MEMORY_PHOTOS_COL3 = [...UNIQUE_PHOTOS_COL3, ...UNIQUE_PHOTOS_COL3, ...UNIQUE_PHOTOS_COL3, ...UNIQUE_PHOTOS_COL3, ...UNIQUE_PHOTOS_COL3];

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);

  // Tab State and elevated Diamond CTA animation values
  const [activeTab, setActiveTab] = useState('home');
  const activeTabScale = useRef(new Animated.Value(1)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleTabPress = (tab, idx) => {
    setActiveTab(tab.id);
    
    // Scale spring animation for active standard tab icon
    activeTabScale.setValue(0.7);
    Animated.spring(activeTabScale, {
      toValue: 1.0,
      friction: 4.5,
      tension: 75,
      useNativeDriver: true,
    }).start();

    if (webViewRef.current) {
      const targetUrl = `${WEB_APP_URL}${tab.path}`;
      webViewRef.current.injectJavaScript(`
        if (window.location.pathname !== '${tab.path}') {
          window.location.href = '${targetUrl}';
        }
      `);
    }
  };

  const handleCTAPress = (tab) => {
    setActiveTab(tab.id);
    
    // Bounce spring animation for the elevated Diamond CTA button
    ctaScale.setValue(0.75);
    Animated.spring(ctaScale, {
      toValue: 1.0,
      friction: 4,
      tension: 65,
      useNativeDriver: true,
    }).start();

    if (webViewRef.current) {
      const targetUrl = `${WEB_APP_URL}${tab.path}`;
      webViewRef.current.injectJavaScript(`
        if (window.location.pathname !== '${tab.path}') {
          window.location.href = '${targetUrl}';
        }
      `);
    }
  };

  // Load local Qurova DEMO fonts and Google Montserrat fonts
  const [fontsLoaded] = useFonts({
    'Qurova-Bold': require('./assets/fonts/QurovaDEMO-Bold.otf'),
    'Qurova-Regular': require('./assets/fonts/QurovaDEMO-Regular.otf'),
    'Qurova-Medium': require('./assets/fonts/QurovaDEMO-Medium.otf'),
    'Qurova-SemiBold': require('./assets/fonts/QurovaDEMO-SemiBold.otf'),
    'Qurova-Light': require('./assets/fonts/QurovaDEMO-Light.otf'),
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const isReady = Platform.OS === 'web' ? true : fontsLoaded;

  // Slider dragging value
  const panX = useRef(new Animated.Value(0)).current; 

  // Marquee scrolling & transition values
  const scrollCol1 = useRef(new Animated.Value(0)).current;
  const scrollCol2 = useRef(new Animated.Value(-TOTAL_SCROLL_DISTANCE)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current; 
  const scaleAnim = useRef(new Animated.Value(1)).current; 
  const arrowTranslation = useRef(new Animated.Value(0)).current; 
  const arrowOpacity = useRef(new Animated.Value(0)).current;

  // Concentric ripples
  const ripple1Scale = useRef(new Animated.Value(0.1)).current;
  const ripple1Opacity = useRef(new Animated.Value(0)).current;
  const ripple2Scale = useRef(new Animated.Value(0.1)).current;
  const ripple2Opacity = useRef(new Animated.Value(0)).current;
  const ripple3Scale = useRef(new Animated.Value(0.1)).current;
  const ripple3Opacity = useRef(new Animated.Value(0)).current;

  const arrowAnimation = useRef(null);
  const activeMarquee = useRef(true);

  // User Agent setup to bypass Google Sign-in constraints
  const customUserAgent = Platform.select({
    android: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    default: undefined
  });

  // Recursive robust scroll functions to ensure 100% infinite loops
  const runCol1 = () => {
    if (!activeMarquee.current) return;
    scrollCol1.setValue(0);
    Animated.timing(scrollCol1, {
      toValue: -TOTAL_SCROLL_DISTANCE,
      duration: 25000, 
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      if (activeMarquee.current) {
        runCol1();
      }
    });
  };

  const runCol2 = () => {
    if (!activeMarquee.current) return;
    scrollCol2.setValue(-TOTAL_SCROLL_DISTANCE);
    Animated.timing(scrollCol2, {
      toValue: 0,
      duration: 25000, 
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      if (activeMarquee.current) {
        runCol2();
      }
    });
  };

  const startMarquee = () => {
    activeMarquee.current = true;
    runCol1();
    runCol2();
  };

  const stopMarquee = () => {
    activeMarquee.current = false;
    scrollCol1.stopAnimation();
    scrollCol2.stopAnimation();
  };

  // Start the shifting arrow idle animation inside the horizontal track
  const startArrowAnimations = () => {
    arrowTranslation.setValue(0);
    arrowOpacity.setValue(0);
    arrowAnimation.current = Animated.loop(
      Animated.parallel([
        Animated.timing(arrowTranslation, {
          toValue: 12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(arrowOpacity, {
            toValue: 0.8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ])
    );
    arrowAnimation.current.start();
  };

  const stopArrowAnimations = () => {
    if (arrowAnimation.current) {
      arrowAnimation.current.stop();
    }
  };

  useEffect(() => {
    if (showOnboarding && isReady) {
      startMarquee();
      startArrowAnimations();
    }
    return () => {
      stopMarquee();
      stopArrowAnimations();
    };
  }, [showOnboarding, isReady]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (!showOnboarding && webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; 
      }
      return false; 
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }

    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      }
    };
  }, [canGoBack, showOnboarding]);

  // Configure PanResponder for dragging the slider button horizontally
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panX.setOffset(panX._value);
        panX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentVal = panX._offset + gestureState.dx;
        if (currentVal >= 0 && currentVal <= MAX_DRAG) {
          panX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        panX.flattenOffset();

        if (panX._value > SWIPE_THRESHOLD) {
          // Snap fully to the right end & initiate REVERSE portal zoom transition
          setIsTransitioning(true);
          stopMarquee(); 

          Animated.parallel([
            // 1. Snap slider button
            Animated.timing(panX, {
              toValue: MAX_DRAG,
              duration: 150,
              useNativeDriver: true,
            }),

            // 2. REVERSE scroll the marquee photo columns rapidly (Backward slide)
            Animated.timing(scrollCol1, {
              toValue: 200, 
              duration: 650,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scrollCol2, {
              toValue: -TOTAL_SCROLL_DISTANCE - 200, 
              duration: 650,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),

            // 3. Zoom-in/scale portal animation from screen center
            Animated.timing(scaleAnim, {
              toValue: 3.5, 
              duration: 900,
              useNativeDriver: true,
            }),
            // 4. Fade layout
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 750,
              useNativeDriver: true,
            }),

            // 5. Staggered ripples in brand teal
            Animated.sequence([
              Animated.parallel([
                Animated.timing(ripple1Scale, { toValue: 4.5, duration: 800, useNativeDriver: true }),
                Animated.timing(ripple1Opacity, { toValue: 1, duration: 250, useNativeDriver: true })
              ]),
              Animated.timing(ripple1Opacity, { toValue: 0, duration: 550, useNativeDriver: true })
            ]),
            Animated.sequence([
              Animated.delay(150),
              Animated.parallel([
                Animated.timing(ripple2Scale, { toValue: 4.5, duration: 800, useNativeDriver: true }),
                Animated.timing(ripple2Opacity, { toValue: 1, duration: 250, useNativeDriver: true })
              ]),
              Animated.timing(ripple2Opacity, { toValue: 0, duration: 550, useNativeDriver: true })
            ]),
            Animated.sequence([
              Animated.delay(300),
              Animated.parallel([
                Animated.timing(ripple3Scale, { toValue: 4.5, duration: 800, useNativeDriver: true }),
                Animated.timing(ripple3Opacity, { toValue: 1, duration: 250, useNativeDriver: true })
              ]),
              Animated.timing(ripple3Opacity, { toValue: 0, duration: 550, useNativeDriver: true })
            ])
          ]).start(() => {
            setShowOnboarding(false);
          });
        } else {
          // Snap back to left side
          Animated.spring(panX, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Handler for receiving message from React Web App
  const onWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      handleBridgeMessage(message, webViewRef);
    } catch (error) {
      console.warn('WebView Message Error:', error);
    }
  };

  // Render basic loader while fonts are resolving
    if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0e0d" />
        <View style={{ flex: 1, position: 'relative', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10 }}>
          <WebView 
            ref={webViewRef}
            source={{ uri: WEB_APP_URL }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsBackForwardNavigationGestures={true}
            userAgent={customUserAgent}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onMessage={onWebViewMessage}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            renderLoading={() => (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#c5a880" />
                <Text style={styles.loaderText}>Loading Kanangal...</Text>
              </View>
            )}
          />
        </View>
      </View>
    );
  }
if (!isReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  // 1. Onboarding Screen Layout
  if (showOnboarding) {
    const contentOpacity = panX.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [1.0, 0.0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.onboardingContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        {/* Dynamic Infinite Marquee background grid of family photos (Rotated at -10deg) */}
        <View style={styles.marqueeBackground}>
          <View style={styles.marqueeOverlay} />
          
          <View style={styles.marqueeGrid}>
            {/* Column 1 (Scrolls Upward) */}
            <Animated.View style={[styles.marqueeColumn, { transform: [{ translateY: scrollCol1 }] }]}>
              {MEMORY_PHOTOS_COL1.map((url, i) => (
                <View key={`col1-${i}`} style={styles.photoFrame}>
                  <Image source={{ uri: url }} style={styles.marqueePhoto} />
                </View>
              ))}
            </Animated.View>

            {/* Column 2 (Scrolls Downward) */}
            <Animated.View style={[styles.marqueeColumn, { transform: [{ translateY: scrollCol2 }] }]}>
              {MEMORY_PHOTOS_COL2.map((url, i) => (
                <View key={`col2-${i}`} style={styles.photoFrame}>
                  <Image source={{ uri: url }} style={styles.marqueePhoto} />
                </View>
              ))}
            </Animated.View>

            {/* Column 3 (Scrolls Upward) */}
            <Animated.View style={[styles.marqueeColumn, { transform: [{ translateY: scrollCol1 }] }]}>
              {MEMORY_PHOTOS_COL3.map((url, i) => (
                <View key={`col3-${i}`} style={styles.photoFrame}>
                  <Image source={{ uri: url }} style={styles.marqueePhoto} />
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        <SafeAreaView style={styles.onboardingContent}>
          {/* Header Content */}
          <View style={styles.textContainer}>
            <Text style={styles.onboardingTitle}>Bring Your</Text>
            <Text style={styles.onboardingTitle}>Memories To Life</Text>
            <Text style={styles.onboardingSubtitle}>
              Manage secure family access and watch your studio albums on the Smart TV.
            </Text>
          </View>

          {/* Bottom Panel with Page Indicators & Horizontal Track */}
          <View style={styles.bottomControlContainer}>
            {/* Onboarding page segments (left aligned) */}
            <View style={styles.indicatorWrapper}>
              <View style={styles.indicatorDot} />
              <View style={styles.indicatorDot} />
              <View style={styles.indicatorDot} />
              <View style={[styles.indicatorDot, styles.activeIndicatorDot]} />
            </View>

            {/* Horizontal Slider Track (Matches Crop Layout) */}
            <View style={styles.sliderTrack}>
              {/* 1. Slide guide text & animated arrows */}
              <Animated.View style={[styles.slideGuideContainer, { opacity: contentOpacity }]}>
                <Text style={styles.slideGuideText}>Start</Text>
                <Animated.View 
                  style={[
                    styles.arrowGroup, 
                    { 
                      opacity: arrowOpacity,
                      transform: [{ translateX: arrowTranslation }] 
                      }
                    ]}
                  >
                  <Text style={guideArrowStyle}>›</Text>
                  <Text style={guideArrowStyle}>›</Text>
                  <Text style={guideArrowStyle}>›</Text>
                </Animated.View>
              </Animated.View>

              {/* 2. The Draggable Slide Button starting at absolute left */}
              <Animated.View 
                style={[
                  styles.goButton, 
                  { transform: [{ translateX: panX }] }
                ]}
                {...panResponder.panHandlers}
              >
                {/* Precise Svg vector lock icon representing CiUnlock from Circum Icons */}
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" style={styles.lockSvg}>
                  <Path
                    d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0v1.5"
                    stroke="#131f24"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Rect
                    x={5}
                    y={11}
                    width={14}
                    height={9}
                    rx={2.2}
                    stroke="#131f24"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx={12}
                    cy={15.5}
                    r={1.2}
                    fill="#131f24"
                  />
                </Svg>
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>

        {/* Staggered Ripples Overlay */}
        {isTransitioning && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.rippleCenterWrapper}>
              <Animated.View style={[styles.rippleRing, { transform: [{ scale: ripple1Scale }], opacity: ripple1Opacity }]} />
              <Animated.View style={[styles.rippleRing, { transform: [{ scale: ripple2Scale }], opacity: ripple2Opacity }]} />
              <Animated.View style={[styles.rippleRing, { transform: [{ scale: ripple3Scale }], opacity: ripple3Opacity }]} />
            </View>
          </View>
        )}
      </Animated.View>
    );
  }

  // Redesigned Tab Bar rendering matching Diamond CTA layout (Option 3)
  const renderRedesignedTabBar = () => {
    const cutoutX = SCREEN_WIDTH / 2;
    const leftTabs = [TABS[0], TABS[1]];
    const rightTabs = [TABS[3], TABS[4]];
    
    return (
      <View style={styles.tabBarContainer}>
        {/* Static White Background Bar with centered smooth concave cutout */}
        <View style={styles.tabBarBackgroundStatic}>
          <Svg width={SCREEN_WIDTH} height={TAB_BAR_HEIGHT} viewBox={`0 0 ${SCREEN_WIDTH} ${TAB_BAR_HEIGHT}`} fill="none">
            <Path 
              d={`M 0 15 L ${cutoutX - 54} 15 C ${cutoutX - 30} 15, ${cutoutX - 22} 50, ${cutoutX} 50 C ${cutoutX + 22} 50, ${cutoutX + 30} 15, ${cutoutX + 54} 15 L ${SCREEN_WIDTH} 15 L ${SCREEN_WIDTH} ${TAB_BAR_HEIGHT} L 0 ${TAB_BAR_HEIGHT} Z`} 
              fill="#ffffff" 
            />
          </Svg>
        </View>

        {/* Elevated central Diamond CTA button */}
        <Animated.View
          style={[
            styles.diamondCTAContainer,
            { transform: [{ scale: ctaScale }] }
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleCTAPress(TABS[2])}
            style={styles.diamondButtonTouch}
          >
            <View style={styles.diamondShape}>
              <View style={styles.diamondIconWrapper}>
                {renderTabIcon('tv', '#ffffff')}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Standard tab buttons positioned left and right of the CTA */}
        <View style={styles.tabButtonsWrapper}>
          {/* Left standard tabs */}
          <View style={styles.sideTabsWrapper}>
            {leftTabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabButton}
                  activeOpacity={0.7}
                  onPress={() => handleTabPress(tab, idx)}
                >
                  <Animated.View style={isActive ? { transform: [{ scale: activeTabScale }] } : null}>
                    {renderTabIcon(tab.id, isActive ? BRAND_GOLD : 'rgba(19, 31, 36, 0.42)')}
                  </Animated.View>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spacer for the center cutout area */}
          <View style={{ width: 64 }} />

          {/* Right standard tabs */}
          <View style={styles.sideTabsWrapper}>
            {rightTabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              // idx + 3 is the correct absolute index for active tab coordination
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabButton}
                  activeOpacity={0.7}
                  onPress={() => handleTabPress(tab, idx + 3)}
                >
                  <Animated.View style={isActive ? { transform: [{ scale: activeTabScale }] } : null}>
                    {renderTabIcon(tab.id, isActive ? BRAND_GOLD : 'rgba(19, 31, 36, 0.42)')}
                  </Animated.View>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Helper mock content render for web platform preview
  const renderMockPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.mockPageContainer}>
            {/* Premium Header matching Saudi/NEOM style */}
            <View style={styles.luxuryHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>K</Text>
              </View>
              <Text style={styles.luxuryHeaderTitle}>Pick your memories.</Text>
              <View style={styles.bellButton}>
                {renderTabIcon('notifications', 'rgba(255, 255, 255, 0.85)')}
              </View>
            </View>

            {/* 3D Layered Card Stack (NEOM Style) */}
            <View style={styles.cardStackContainer}>
              {/* Back Card (Layer 3) */}
              <View style={[styles.stackCard, styles.stackCardBack]} />
              
              {/* Middle Card (Layer 2) */}
              <View style={[styles.stackCard, styles.stackCardMiddle]} />

              {/* Front Main Card (Layer 1) */}
              <View style={[styles.stackCard, styles.stackCardFront]}>
                <Image source={{ uri: UNIQUE_PHOTOS_COL1[0] }} style={styles.stackCardImage} />
                
                {/* Dark Gradient Overlay for high-end text legibility */}
                <View style={styles.cardGradientOverlay} />

                {/* Card Content Overlay */}
                <View style={styles.cardContent}>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>WEDDING DAY</Text>
                  </View>
                  <Text style={styles.cardMainTitle}>THE CEREMONY</Text>
                  <Text style={styles.cardSubTitle}>Capturing the sacred bonds and joyful laughter of our wedding day.</Text>
                  
                  {/* Premium White Button */}
                  <TouchableOpacity style={styles.exploreButton} activeOpacity={0.9}>
                    <Text style={styles.exploreButtonText}>Explore Album</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );
      case 'search':
        return (
          <View style={styles.mockPageContainer}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryHeaderTitleLeft}>Search Studio</Text>
            </View>
            <View style={styles.searchBarMock}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Montserrat_400Regular' }}>Search family albums...</Text>
            </View>
            <View style={styles.tagChipsWrapper}>
              <View style={styles.tagChip}><Text style={styles.tagChipText}>#couple</Text></View>
              <View style={styles.tagChip}><Text style={styles.tagChipText}>#wedding</Text></View>
              <View style={styles.tagChip}><Text style={styles.tagChipText}>#ceremony</Text></View>
              <View style={styles.tagChip}><Text style={styles.tagChipText}>#candid</Text></View>
            </View>
          </View>
        );
      case 'tv':
        return (
          <View style={styles.mockPageContainer}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryHeaderTitleLeft}>TV Casting</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={BRAND_GOLD} strokeWidth={1.8}>
                <Rect x={2} y={7} width={20} height={13} rx={2} />
                <Path d="M17 2l-5 5-5-5" />
              </Svg>
              <Text style={{ color: '#fff', marginTop: 20, fontFamily: 'Montserrat_600SemiBold', fontSize: 18 }}>Smart TV Connected</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontFamily: 'Montserrat_400Regular', fontSize: 13, textAlign: 'center', marginHorizontal: 30 }}>Ready to stream high-resolution family albums directly to your smart TV screen.</Text>
            </View>
          </View>
        );
      case 'notifications':
        return (
          <View style={styles.mockPageContainer}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryHeaderTitleLeft}>Notifications</Text>
            </View>
            <View style={styles.notifyMock}>
              <Text style={{ color: '#fff', fontFamily: 'Montserrat_500Medium', fontSize: 14 }}>Suresh shared the Wedding Album</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, fontFamily: 'Montserrat_400Regular' }}>2 hours ago</Text>
            </View>
          </View>
        );
      case 'profile':
        return (
          <View style={styles.mockPageContainer}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryHeaderTitleLeft}>My Profile</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#181614', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BRAND_GOLD }}>
                <Text style={{ color: BRAND_GOLD, fontSize: 32, fontFamily: 'Qurova-Bold' }}>K</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 19, marginTop: 16, fontFamily: 'Montserrat_600SemiBold' }}>Kanangal Admin</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4, fontFamily: 'Montserrat_400Regular' }}>admin@kanangal.studio</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // 2. Web Preview Screen (Enables interactive Liquid Bottom Tab Bar testing on Web browser)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0e0d" />
        <View style={{ flex: 1, position: 'relative' }}>
          
          {/* Interactive Mock Content Area */}
          <View style={{ flex: 1, padding: 20, paddingTop: 20 }}>
            {renderMockPage()}
          </View>

          {/* Spacer */}
          <View style={{ height: TAB_BAR_HEIGHT - 10, backgroundColor: '#0f0e0d' }} />

          {/* Bonding Bottom Tab Bar */}
          {renderRedesignedTabBar()}
        </View>
      </SafeAreaView>
    );
  }

  // 3. Native Mobile WebView Shell with liquid bonding tab bar
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0e0d" />
      
      <View style={{ flex: 1, position: 'relative' }}>
        <WebView 
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          userAgent={customUserAgent}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onMessage={onWebViewMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={BRAND_GOLD} />
              <Text style={styles.loaderText}>Loading Kanangal...</Text>
            </View>
          )}
        />

        {/* Spacer at the bottom so WebView contents aren't blocked by the tab bar */}
        <View style={{ height: TAB_BAR_HEIGHT - 10, backgroundColor: '#0f0e0d' }} />

        {/* Bonding Bottom Tab Bar */}
        {renderRedesignedTabBar()}
      </View>
    </SafeAreaView>
  );
}

// Inline helper styles
const guideArrowStyle = {
  color: BRAND_GOLD,
  fontSize: 18,
  fontWeight: '800',
  marginHorizontal: 1,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0e0d',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0e0d',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0e0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#c5a880',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: 'Montserrat_600SemiBold',
  },
  webFallbackContainer: {
    flex: 1,
    backgroundColor: '#0f0e0d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Onboarding Screen Layout
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#0f0e0d', 
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  
  // Dynamic Infinite Photo Marquee Styles
  marqueeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0e0d',
    overflow: 'hidden',
  },
  marqueeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 14, 13, 0.82)', 
    zIndex: 1,
  },
  // Matches the exact slanted marquee from the admin web design
  marqueeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: SCREEN_WIDTH * 1.35, 
    height: SCREEN_HEIGHT * 1.35,
    transform: [{ rotate: '-10deg' }, { scale: 1.15 }], 
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  marqueeColumn: {
    width: '31%',
    flexDirection: 'column',
  },
  photoFrame: {
    width: '100%',
    height: PHOTO_FRAME_HEIGHT,
    borderRadius: 20, 
    marginVertical: 10,
    backgroundColor: '#181614',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  marqueePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  textContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 2,
  },
  onboardingTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 42,
    letterSpacing: -0.5,
    fontFamily: 'Qurova-Bold', 
  },
  onboardingSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontFamily: 'Montserrat_400Regular', 
  },

  // Bottom Controls Layout (Aqara Style)
  bottomControlContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    zIndex: 2,
  },
  indicatorWrapper: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: 24,
    paddingLeft: 12,
  },
  indicatorDot: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 4,
  },
  activeIndicatorDot: {
    width: 24,
    backgroundColor: BRAND_GOLD,
  },
  
  // Horizontal Slider Pill Track
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: BUTTON_SIZE + (TRACK_PADDING * 2),
    borderRadius: (BUTTON_SIZE + (TRACK_PADDING * 2)) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: TRACK_PADDING,
    position: 'relative',
  },
  slideGuideContainer: {
    position: 'absolute',
    left: BUTTON_SIZE + 24, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideGuideText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Montserrat_600SemiBold', 
  },
  arrowGroup: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  goButton: {
    position: 'absolute',
    left: TRACK_PADDING, 
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  lockSvg: {
    marginTop: 0, 
  },

  // Portal Cast ripples
  rippleCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: (SCREEN_WIDTH * 0.4) / 2,
    borderWidth: 3,
    borderColor: BRAND_GOLD,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  
  // Bonding Liquid Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    backgroundColor: 'transparent',
  },
  tabBarBackgroundStatic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  diamondCTAContainer: {
    position: 'absolute',
    top: -7, // floats nicely in the center cutout
    left: SCREEN_WIDTH / 2 - BUBBLE_SIZE / 2,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    zIndex: 10,
  },
  diamondButtonTouch: {
    width: '100%',
    height: '100%',
  },
  diamondShape: {
    width: '100%',
    height: '100%',
    borderRadius: 14, // squircle shape (Option 3 style)
    backgroundColor: '#1b2d35', // Deep slate (matches luxury dark background/Option 2 style)
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  diamondIconWrapper: {
    transform: [{ rotate: '-45deg' }], // reverse rotate to make the icon upright
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonsWrapper: {
    position: 'absolute',
    top: 15, 
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT - 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  sideTabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: (SCREEN_WIDTH - 84) / 2, // split side tabs evenly around the central 64px spacer
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 10,
    position: 'relative',
    // Remove black focus box outline on web browsers
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      default: {},
    }),
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND_GOLD,
  },
  
  // Interactive Web Mock Preview Styles
  webPreviewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#181614',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  webPreviewHeaderText: {
    color: '#fff',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  webResetButton: {
    backgroundColor: 'rgba(197, 168, 128, 0.15)',
    borderColor: BRAND_GOLD,
    borderWidth: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  webResetButtonText: {
    color: BRAND_GOLD,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  mockPageContainer: {
    flex: 1,
  },
  
  // Luxury NEOM Style Headers
  luxuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 24,
  },
  luxuryHeaderTitle: {
    color: '#ffffff',
    fontFamily: 'Qurova-Bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  luxuryHeaderTitleLeft: {
    color: '#ffffff',
    fontFamily: 'Qurova-Bold',
    fontSize: 24,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#0f0e0d',
    fontFamily: 'Qurova-Bold',
    fontSize: 18,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  // 3D Layered Card Stack Layout (Option 3 / Saudi aesthetic)
  cardStackContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_HEIGHT * 0.52,
    marginTop: 10,
  },
  stackCard: {
    borderRadius: 24,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  stackCardBack: {
    width: '84%',
    height: '92%',
    backgroundColor: '#181614',
    opacity: 0.25,
    top: 0,
    transform: [{ scaleX: 0.9 }],
    zIndex: 1,
  },
  stackCardMiddle: {
    width: '92%',
    height: '94%',
    backgroundColor: '#23201d',
    opacity: 0.6,
    top: 15,
    transform: [{ scaleX: 0.95 }],
    zIndex: 2,
  },
  stackCardFront: {
    width: '100%',
    height: '96%',
    backgroundColor: '#0f0e0d',
    top: 30,
    overflow: 'hidden',
    zIndex: 3,
  },
  stackCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Premium gradient substitute
  },
  cardContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: 'rgba(197, 168, 128, 0.15)',
    borderColor: BRAND_GOLD,
    borderWidth: 1.2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  tagText: {
    color: BRAND_GOLD,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
  },
  cardMainTitle: {
    color: '#ffffff',
    fontFamily: 'Qurova-Bold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardSubTitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  exploreButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  exploreButtonText: {
    color: '#0f0e0d',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Premium Search Tag Chips
  tagChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tagChip: {
    backgroundColor: '#181614',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  searchBarMock: {
    backgroundColor: '#181614',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  notifyMock: {
    backgroundColor: '#181614',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});

