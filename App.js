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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { handleBridgeMessage } from './src/bridge';

const WEB_APP_URL = 'https://kanangal-app.pages.dev'; 

export default function App() {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);

  // User Agent setup to help the web app identify it's running inside the mobile app
  const customUserAgent = Platform.select({
    android: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 KanangalMobileApp',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 KanangalMobileApp',
    default: undefined
  });

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
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
  }, [canGoBack]);

  // Handler for receiving message from React Web App
  const onWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      handleBridgeMessage(message, webViewRef);
    } catch (error) {
      console.warn('WebView Message Error:', error);
    }
  };

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
    zIndex: 9999,
  },
  loaderText: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
