import { useEffect, useState } from "react";
import "./ConsentBanner.css";

const CONSENT_KEY = "shaurya-consent-v1";
const consentValues = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

function updateConsent(value) {
  const granted = value === "granted";
  const nextConsent = Object.fromEntries(
    Object.keys(consentValues).map(key => [key, granted ? "granted" : "denied"]),
  );

  window.gtag?.("consent", "update", nextConsent);
  localStorage.setItem(CONSENT_KEY, value);
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(CONSENT_KEY));
  }, []);

  const chooseConsent = value => {
    updateConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="consent-banner" aria-label="Cookie consent">
      <div className="consent-copy">
        <strong>Privacy choices</strong>
        <p>We use analytics to improve Shaurya Tools. You can accept or decline optional measurement.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-decline" onClick={() => chooseConsent("denied")}>Decline</button>
        <button type="button" className="consent-accept" onClick={() => chooseConsent("granted")}>Accept</button>
      </div>
    </aside>
  );
}
