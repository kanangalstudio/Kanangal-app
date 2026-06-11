import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  StatusBar, 
  ActivityIndicator, 
  View, 
  Text,
  Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';

// Configurable Web Application URL.
// Change this to your live Vercel / Render / Firebase Hosting URL in production.
// For local testing on your physical phone, use your computer's local IP (e.g. 'http://192.168.1.100:5173')
const WEB_APP_URL = 'https://kanangal-admin.onrender.com'; 

export default function App() {
  const [loading, setLoading] = useState(true);

  // Use a standard mobile browser user agent to prevent Google OAuth from blocking the login inside the WebView
  const customUserAgent = Platform.select({
    android: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    default: undefined
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131f24" />
      
      <WebView 
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        userAgent={customUserAgent}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.loaderText}>Loading Kanangal...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  webview: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#131f24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#14b8a6',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
