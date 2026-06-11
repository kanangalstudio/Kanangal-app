import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

GoogleSignin.configure({
  // Replace with your Web Client ID from Firebase Console -> Authentication -> Sign-in method -> Google (under web SDK configuration)
  webClientId: '882267028011-hp0r1a0d8g24s6k61t1cr2q0pl2uouda.apps.googleusercontent.com',
  offlineAccess: true,
});

export const signInWithGoogleNative = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    
    // Handle SDK v10+ format (response.data) and older formats
    const idToken = response.data?.idToken || response.idToken;
    
    if (!idToken) {
      throw new Error('No ID Token returned from Google Sign-In');
    }
    
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    console.error('Native Google Sign-In Error:', error);
    throw error;
  }
};
