import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PERMANENT = 'paywallPromptPermanentDismiss';
const STORAGE_KEY_LAST_DISMISSED = 'paywallPromptLastDismissedDate';

interface PaywallPromptState {
  shouldShowPrompt: boolean;
  markPromptDismissed: (permanent: boolean) => void;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function usePaywallPrompt(): PaywallPromptState {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      setShouldShow(true);
      return;
    }

    // Check if permanently dismissed
    const permanentDismiss = localStorage.getItem(STORAGE_KEY_PERMANENT);
    if (permanentDismiss === 'true') {
      setShouldShow(false);
      return;
    }

    // Check if already dismissed today
    const lastDismissed = localStorage.getItem(STORAGE_KEY_LAST_DISMISSED);
    const today = getTodayString();
    
    if (lastDismissed === today) {
      setShouldShow(false);
    } else {
      setShouldShow(true);
    }
  }, []);

  const markPromptDismissed = useCallback((permanent: boolean) => {
    if (!isLocalStorageAvailable()) return;

    const today = getTodayString();
    
    if (permanent) {
      // Permanent dismissal
      localStorage.setItem(STORAGE_KEY_PERMANENT, 'true');
      localStorage.setItem(STORAGE_KEY_LAST_DISMISSED, today);
    } else {
      // Temporary dismissal (today only)
      localStorage.setItem(STORAGE_KEY_LAST_DISMISSED, today);
    }
    
    setShouldShow(false);
  }, []);

  return {
    shouldShowPrompt: shouldShow,
    markPromptDismissed,
  };
}

// Hook to check if we should intercept a link click
export function usePaywallLinkInterceptor() {
  const { shouldShowPrompt, markPromptDismissed } = usePaywallPrompt();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const interceptLinkClick = useCallback((url: string): boolean => {
    if (!shouldShowPrompt) {
      // Don't intercept, allow direct navigation
      return false;
    }
    
    // Intercept and show modal
    setPendingUrl(url);
    setShowModal(true);
    return true;
  }, [shouldShowPrompt]);

  const handleContinue = useCallback((permanent: boolean) => {
    markPromptDismissed(permanent);
    setShowModal(false);
    
    // Navigate to the pending URL
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
      setPendingUrl(null);
    }
  }, [markPromptDismissed, pendingUrl]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setPendingUrl(null);
  }, []);

  return {
    showModal,
    pendingUrl,
    interceptLinkClick,
    handleContinue,
    handleClose,
  };
}
