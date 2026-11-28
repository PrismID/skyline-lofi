(() => {
  "use strict";

  const root = document.documentElement;
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const compactViewport = window.matchMedia("(max-width: 760px)");
  const portraitViewport = window.matchMedia("(orientation: portrait)");

  function isTabletDevice() {
    const userAgent = navigator.userAgent || "";
    const touchPoints = navigator.maxTouchPoints || 0;
    const screenWidth = window.screen?.width || window.innerWidth;
    const screenHeight = window.screen?.height || window.innerHeight;
    const shortestScreenSide = Math.min(screenWidth, screenHeight);

    const userAgentData = navigator.userAgentData;
    const reportedTablet = Array.isArray(userAgentData?.formFactors)
      && userAgentData.formFactors.includes("Tablet");
    const iPad = /iPad/i.test(userAgent)
      || (/Macintosh/i.test(userAgent) && touchPoints > 1);
    const androidTablet = /Android/i.test(userAgent)
      && !/Mobile/i.test(userAgent);
    const largeTouchScreen = touchPoints > 1
      && coarsePointer.matches
      && shortestScreenSide >= 600;

    return reportedTablet || iPad || androidTablet || largeTouchScreen;
  }

  function updateDeviceInfo() {
    root.dataset.inputMode = coarsePointer.matches ? "touch" : "pointer";
    root.dataset.viewport = compactViewport.matches ? "compact" : "wide";
  }

  function enforceTabletLandscape() {
    // Phones and desktop devices are deliberately left untouched.
    if (!isTabletDevice()) return;

    const overlay = document.createElement("div");
    overlay.id = "skyline-tablet-orientation-lock";
    overlay.setAttribute("role", "alert");
    overlay.setAttribute("aria-live", "assertive");

    const content = document.createElement("div");
    const icon = document.createElement("div");
    const heading = document.createElement("h1");
    const message = document.createElement("p");

    icon.textContent = "↻";
    heading.textContent = "Rotate your tablet";
    message.textContent = "Skyline works best in landscape mode. Turn your tablet sideways to continue.";

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      width: "100vw",
      height: "100vh",
      height: "100dvh",
      padding: "32px",
      background: "#090b12",
      color: "#ffffff",
      textAlign: "center",
      pointerEvents: "auto",
      touchAction: "none"
    });

    Object.assign(content.style, {
      width: "100%",
      maxWidth: "440px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
      fontFamily: "system-ui, sans-serif"
    });

    Object.assign(icon.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "88px",
      height: "88px",
      border: "2px solid rgba(255,255,255,.7)",
      borderRadius: "24px",
      fontSize: "54px",
      lineHeight: "1",
      color: "#9bdcff"
    });

    Object.assign(heading.style, {
      margin: "10px 0 0",
      fontSize: "clamp(26px, 5vw, 38px)",
      fontWeight: "700"
    });

    Object.assign(message.style, {
      margin: "0",
      maxWidth: "360px",
      color: "rgba(255,255,255,.76)",
      fontSize: "16px",
      lineHeight: "1.6"
    });

    content.append(icon, heading, message);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    function updateOrientationLock() {
      const portrait = portraitViewport.matches;
      overlay.style.display = portrait ? "flex" : "none";
      document.body.style.overflow = portrait ? "hidden" : "";
      document.documentElement.style.overflow = portrait ? "hidden" : "";
    }

    updateOrientationLock();
    portraitViewport.addEventListener("change", updateOrientationLock);
    window.addEventListener("orientationchange", updateOrientationLock);
    window.addEventListener("resize", updateOrientationLock);
    screen.orientation?.addEventListener?.("change", updateOrientationLock);
  }

  // CSS media queries remain responsible for responsive layout.
  updateDeviceInfo();
  coarsePointer.addEventListener("change", updateDeviceInfo);
  compactViewport.addEventListener("change", updateDeviceInfo);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enforceTabletLandscape, { once: true });
  } else {
    enforceTabletLandscape();
  }
})();
