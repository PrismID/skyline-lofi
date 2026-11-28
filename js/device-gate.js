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

    // Prefer explicit tablet signals, including iPads using desktop-mode Safari.
    const userAgentData = navigator.userAgentData;
    const reportedTablet = Array.isArray(userAgentData?.formFactors)
      && userAgentData.formFactors.includes("Tablet");
    const iPad = /iPad/i.test(userAgent)
      || (/Macintosh/i.test(userAgent) && touchPoints > 1);
    const androidTablet = /Android/i.test(userAgent)
      && !/Mobile/i.test(userAgent);

    // Fallback for tablets whose browser does not identify its form factor.
    const largeTouchScreen = touchPoints > 1
      && coarsePointer.matches
      && shortestScreenSide >= 600;

    return reportedTablet || iPad || androidTablet || largeTouchScreen;
  }

  function updateDeviceInfo() {
    root.dataset.inputMode = coarsePointer.matches ? "touch" : "pointer";
    root.dataset.viewport = compactViewport.matches ? "compact" : "wide";
  }

  function addTabletLandscapeNotice() {
    if (!isTabletDevice()) return;

    const notice = document.createElement("div");
    notice.id = "skyline-tablet-landscape-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.textContent = "For the best Skyline experience, turn your tablet sideways (landscape).";

    Object.assign(notice.style, {
      position: "fixed",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      width: "max-content",
      maxWidth: "calc(100vw - 32px)",
      boxSizing: "border-box",
      padding: "12px 18px",
      borderRadius: "12px",
      background: "rgba(20, 20, 28, 0.96)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.28)",
      font: "600 14px/1.45 system-ui, sans-serif",
      textAlign: "center",
      pointerEvents: "none",
      display: "none"
    });

    document.body.appendChild(notice);

    function updateNoticeVisibility() {
      const isPortrait = portraitViewport.matches;
      notice.style.display = isPortrait ? "block" : "none";
    }

    updateNoticeVisibility();
    portraitViewport.addEventListener("change", updateNoticeVisibility);
    window.addEventListener("orientationchange", updateNoticeVisibility);
  }

  // CSS media queries handle the responsive layout. These attributes are
  // optional hints for scripts that need to adapt to the current device.
  updateDeviceInfo();
  coarsePointer.addEventListener("change", updateDeviceInfo);
  compactViewport.addEventListener("change", updateDeviceInfo);

  // The orientation reminder is created only on tablet devices.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addTabletLandscapeNotice, { once: true });
  } else {
    addTabletLandscapeNotice();
  }
})();
