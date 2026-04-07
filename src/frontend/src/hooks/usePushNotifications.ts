import { useEffect, useRef } from "react";

const PERMISSION_KEY = "tt_notif_asked";

/**
 * Requests notification permission once (after user has been on the page
 * for a few seconds). Stores the subscription structure for future push
 * notification integration. Does NOT connect to any external service.
 */
export function usePushNotifications() {
  const askedRef = useRef(false);

  useEffect(() => {
    // Don't ask if already asked or not supported
    if (
      askedRef.current ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      Notification.permission === "denied"
    ) {
      return;
    }

    // Don't ask twice across sessions
    if (localStorage.getItem(PERMISSION_KEY)) return;

    // Wait 8 seconds before asking (good UX practice)
    const timer = setTimeout(async () => {
      askedRef.current = true;

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission().catch(
          () => "denied",
        );
        localStorage.setItem(PERMISSION_KEY, "1");

        if (permission === "granted") {
          console.log("[Push] Notification permission granted");
          // Future: subscribe to push server here
          // const registration = await navigator.serviceWorker.ready;
          // const subscription = await registration.pushManager.subscribe({...});
        }
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);
}
