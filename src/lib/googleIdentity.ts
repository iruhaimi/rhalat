const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';
const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client';

export const GOOGLE_WEB_CLIENT_ID = '96772078009-3504quk2lhmc3vh8k73t0qsj1mrj42ku.apps.googleusercontent.com';

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
      cancel: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser'));
  }

  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not be loaded'));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export async function requestGoogleIdToken(): Promise<string> {
  await loadGoogleIdentityScript();

  const google = window.google;
  if (!google?.accounts?.id) {
    throw new Error('Google sign-in is not available');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (token?: string, error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      try {
        google.accounts.id.cancel();
      } catch {
        // ignore cancellation errors from the browser prompt
      }
      if (token) {
        resolve(token);
        return;
      }
      reject(error ?? new Error('Google sign-in was cancelled'));
    };

    const timeoutId = window.setTimeout(() => {
      finish(undefined, new Error('Google sign-in timed out'));
    }, 60000);

    google.accounts.id.initialize({
      client_id: GOOGLE_WEB_CLIENT_ID,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        if (response.credential) {
          finish(response.credential);
          return;
        }
        finish(undefined, new Error('Google did not return an identity token'));
      },
    });

    google.accounts.id.prompt((notification) => {
      if (!notification.isNotDisplayed() && !notification.isSkippedMoment()) return;
      const reason = notification.getNotDisplayedReason?.() ?? notification.getSkippedReason?.();
      finish(undefined, new Error(reason || 'Google sign-in was cancelled'));
    });
  });
}