import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function Analytics() {
  const { pathname, search } = useLocation();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: `${pathname}${search}`,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, search]);

  return null;
}
