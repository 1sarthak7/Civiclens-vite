import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  BackHandler,
  Platform,
  Animated,
  Dimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Network from 'expo-network';
import * as SplashScreen from 'expo-splash-screen';

// Height of the system status bar (notch area)
const STATUS_BAR_HEIGHT = RNStatusBar.currentHeight || 0;

// Keep splash visible while we prepare
SplashScreen.preventAutoHideAsync();

const WEBSITE_URL = 'https://civiclensapp.in';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color palette (matches website) ───
const COLORS = {
  navy: '#1a3c6e',
  navyLight: '#2a5298',
  saffron: '#f47920',
  saffronDark: '#d96810',
  green: '#138808',
  white: '#ffffff',
  bgPrimary: '#f8f9fa',
  textPrimary: '#1a1a2e',
  textMuted: '#6b7280',
  danger: '#dc2626',
};

// ─── JavaScript to inject into WebView for mobile optimizations ───
const INJECTED_JS = `
  (function() {
    // Ensure proper viewport
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      document.head.appendChild(vp);
    }
    vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';

    // Prevent horizontal overflow
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.maxWidth = '100vw';

    // Hide the top info bar (redundant in-app)
    const topBar = document.getElementById('top-bar');
    if (topBar) topBar.style.display = 'none';

    // Make all inputs 16px to prevent iOS zoom
    const style = document.createElement('style');
    style.textContent = \`
      input, select, textarea { font-size: 16px !important; }
      .btn, button, a.nav-link, .btn-outline-nav, .btn-primary-nav {
        min-height: 44px;
        min-width: 44px;
      }
      /* Tighter mobile spacing */
      @media (max-width: 768px) {
        .top-bar { display: none !important; }
        .hero-banner { padding: 60px 5% 80px; min-height: 380px; }
        .stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .about-grid { grid-template-columns: 1fr; gap: 24px; }
        .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .features-grid { grid-template-columns: 1fr; }
        .reports-grid { grid-template-columns: 1fr; }
        .news-grid { grid-template-columns: 1fr; }
        .footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
        .carousel-slide { width: 260px; }
        .carousel-slide-inner { height: 340px; }
        .container { padding: 0 16px; }

        /* ── DASHBOARD MAP FIX ── */
        /* Make map significantly larger on mobile */
        .dashboard-layout {
          grid-template-rows: 55vh 1fr !important;
        }
        .map-area {
          height: 55vh !important;
          min-height: 300px !important;
        }
        #map {
          height: 100% !important;
          min-height: 300px !important;
        }
      }
      @media (max-width: 480px) {
        .footer-grid { grid-template-columns: 1fr; }
        .steps-grid { grid-template-columns: 1fr; }
        /* Even on smaller screens, keep map large */
        .dashboard-layout {
          grid-template-rows: 50vh 1fr !important;
        }
        .map-area {
          height: 50vh !important;
          min-height: 260px !important;
        }
      }
    \`;
    document.head.appendChild(style);

    // Signal to React Native that injection is done
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'injected' }));
  })();
  true;
`;

export default function App() {
  const webViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // ─── Network state check ───
  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected || !state.isInternetReachable);
      return state.isConnected && state.isInternetReachable;
    } catch {
      return true; // Assume online if check fails
    }
  }, []);

  // ─── Hide splash once app is ready ───
  useEffect(() => {
    async function prepare() {
      await checkNetwork();
      setAppReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, [checkNetwork]);

  // ─── Android back button handler ───
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [canGoBack]);

  // ─── Loading finished handler ───
  const handleLoadEnd = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    // Fade out loading overlay
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setIsLoading(false);
    });
  }, [fadeAnim]);

  // ─── Loading started handler ───
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  // ─── Error handler ───
  const handleError = useCallback(
    async (syntheticEvent) => {
      const { nativeEvent } = syntheticEvent;
      const online = await checkNetwork();

      setHasError(true);
      if (!online) {
        setIsOffline(true);
        setErrorMessage('No internet connection. Please check your network and try again.');
      } else {
        setErrorMessage(
          nativeEvent.description || 'Something went wrong. Please try again.'
        );
      }
      setIsLoading(false);
      fadeAnim.setValue(0);
    },
    [checkNetwork, fadeAnim]
  );

  // ─── HTTP error handler ───
  const handleHttpError = useCallback(
    (syntheticEvent) => {
      const { nativeEvent } = syntheticEvent;
      if (nativeEvent.statusCode >= 400) {
        setHasError(true);
        setErrorMessage(
          `Server error (${nativeEvent.statusCode}). Please try again later.`
        );
        setIsLoading(false);
        fadeAnim.setValue(0);
      }
    },
    [fadeAnim]
  );

  // ─── Retry handler ───
  const handleRetry = useCallback(async () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    fadeAnim.setValue(1);

    const online = await checkNetwork();
    if (!online) {
      setIsOffline(true);
      setHasError(true);
      setErrorMessage('Still no internet. Please check your connection.');
      setIsLoading(false);
      fadeAnim.setValue(0);
      return;
    }

    setIsOffline(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, [checkNetwork, fadeAnim]);

  // ─── Navigation state change ───
  const handleNavigationStateChange = useCallback((navState) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  if (!appReady) {
    return null; // Splash screen is still visible
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.navy} translucent={false} />

      {/* Status bar spacer — pushes content below the notch */}
      <View style={styles.statusBarSpacer} />

      <View style={styles.container}>
        {/* WebView — NO ScrollView wrapper to avoid scroll conflicts */}
        <WebView
          ref={webViewRef}
          source={{ uri: WEBSITE_URL }}
          style={styles.webView}
          // ─── Core Settings ───
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          // ─── Geolocation ───
          geolocationEnabled={true}
          // ─── File Upload / Camera ───
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          // ─── Performance ───
          cacheEnabled={true}
          cacheMode={'LOAD_DEFAULT'}
          // ─── Pull to refresh (native Android) ───
          pullToRefreshEnabled={true}
          // ─── Injected JS ───
          injectedJavaScript={INJECTED_JS}
          // ─── Event Handlers ───
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadProgress={({ nativeEvent }) =>
            setLoadProgress(nativeEvent.progress)
          }
          // ─── Message handler ───
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'injected') {
                // JS injection successful
              }
            } catch {
              // Ignore parse errors
            }
          }}
          // ─── Android specific ───
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          textZoom={100}
          // ─── Scrolling — let WebView handle ALL scroll ───
          nestedScrollEnabled={true}
          // ─── Prevent external browser opens ───
          originWhitelist={['https://*', 'http://*']}
          onShouldStartLoadWithRequest={(request) => {
            // Keep all navigation within the app
            return true;
          }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <Animated.View
            style={[styles.loadingOverlay, { opacity: fadeAnim }]}
            pointerEvents="none"
          >
            <View style={styles.loadingContent}>
              {/* CivicLens Logo */}
              <View style={styles.loadingLogo}>
                <Image
                  source={require('./assets/civiclens-logo.png')}
                  style={styles.loadingLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.loadingTitle}>CivicLens</Text>
              <Text style={styles.loadingSubtitle}>
                Citizen Grievance Tracking
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.max(loadProgress * 100, 10)}%` },
                  ]}
                />
              </View>

              <ActivityIndicator
                size="small"
                color={COLORS.saffron}
                style={styles.loadingSpinner}
              />
            </View>
          </Animated.View>
        )}

        {/* Error Overlay */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <View style={styles.errorCard}>
              {/* CivicLens Logo in error screen too */}
              <Image
                source={require('./assets/civiclens-logo.png')}
                style={styles.errorLogo}
                resizeMode="contain"
              />

              <Text style={styles.errorTitle}>
                {isOffline ? 'No Connection' : 'Something Went Wrong'}
              </Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {isOffline && (
                <Text style={styles.offlineHint}>
                  Check your connection and tap "Try Again"
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  statusBarSpacer: {
    height: STATUS_BAR_HEIGHT,
    backgroundColor: COLORS.navy,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webView: {
    flex: 1,
  },

  // ─── Loading Overlay ───
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingLogo: {
    marginBottom: 24,
  },
  loadingLogoImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  progressBarContainer: {
    width: SCREEN_WIDTH * 0.55,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.saffron,
    borderRadius: 2,
  },
  loadingSpinner: {
    marginTop: 4,
  },

  // ─── Error Overlay ───
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  errorLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  offlineHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
