import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Handles action requests received from the React web app.
 * @param {object} message The message payload { type, transactionId, payload }
 * @param {object} webViewRef Reference to the WebView to inject responses
 */
export async function handleBridgeMessage(message, webViewRef) {
  const { type, transactionId, payload } = message;
  
  if (!type || !transactionId) return;

  const sendResponse = (success, data = null, error = null) => {
    const responsePayload = JSON.stringify({
      type,
      transactionId,
      success,
      data,
      error
    });
    
    const jsInjection = `window.onNativeResponse(${responsePayload});`;
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(jsInjection);
    }
  };

  try {
    switch (type) {
      case 'GET_LOCATION': {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return sendResponse(false, null, 'Location permission denied');
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        sendResponse(true, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        });
        break;
      }

      case 'GET_NOTIFICATION_TOKEN': {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          return sendResponse(false, null, 'Notification permission denied');
        }
        
        // Fetch push token (use Expo token by default)
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        sendResponse(true, { token });
        break;
      }

      case 'BIOMETRIC_AUTH': {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
          return sendResponse(false, null, 'Biometrics hardware not available or not configured');
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: payload.reason || 'Authenticate to proceed',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });

        if (result.success) {
          sendResponse(true, { authenticated: true });
        } else {
          sendResponse(false, null, result.error || 'Authentication failed');
        }
        break;
      }

      case 'SHARE_CONTENT': {
        const { url, title, message: shareMessage } = payload;
        
        if (Platform.OS === 'web') {
          return sendResponse(false, null, 'Sharing not supported on Web platform');
        }

        // Check if sharing is available on the device
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          return sendResponse(false, null, 'Native sharing is not available on this device');
        }

        // Sharing content (React Native Share can be used if sharing URLs directly)
        // Let's use Expo Sharing for files/content
        if (url) {
          await Sharing.shareAsync(url, { dialogTitle: title || 'Share' });
          sendResponse(true, { shared: true });
        } else {
          // Fallback message dialog
          Alert.alert(title || 'Share', shareMessage || '');
          sendResponse(true, { shared: true });
        }
        break;
      }

      case 'SHOW_ALERT': {
        const { title, message: alertMessage } = payload;
        Alert.alert(title || 'Alert', alertMessage || 'Notification from Web App');
        sendResponse(true, { shown: true });
        break;
      }

      default:
        sendResponse(false, null, `Unknown method: ${type}`);
        break;
    }
  } catch (error) {
    sendResponse(false, null, error.message || 'An internal native error occurred');
  }
}
