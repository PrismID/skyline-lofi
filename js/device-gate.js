(() => {
  const page = document.body.dataset.devicePage || "desktop";
  const userAgent = navigator.userAgent || "";
  const mobileUserAgent = /Android.*Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(userAgent);
  const mobileHint = navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean"
    ? navigator.userAgentData.mobile
    : null;
  const narrowTouchDevice = window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;
  const isPhone = mobileHint === null ? (mobileUserAgent || narrowTouchDevice) : (mobileHint || mobileUserAgent);
  const mismatch = (page === "desktop" && isPhone) || (page === "mobile" && !isPhone);

  const style = document.createElement("style");
  style.textContent = `
    .skyline-device-gate {
      position: fixed; inset: 0; z-index: 2147483647; display: grid;
      place-items: center; padding: 24px; background:
      radial-gradient(ellipse at 50% 0%, rgba(82,104,87,.28), transparent 55%),
      #0d110f; color: #f0f4f1; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .skyline-device-card {
      width: min(100%, 460px); padding: 36px 30px; text-align: center;
      background: rgba(22,28,24,.92); border: 1px solid rgba(255,255,255,.12);
      border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.48);
    }
    .skyline-device-mark { color: #d4836a; font-size: 13px; font-weight: 700;
      letter-spacing: 4px; text-transform: uppercase; margin-bottom: 18px; }
    .skyline-device-card h1 { font-family: 'Comfortaa', sans-serif; font-size: clamp(25px, 6vw, 34px);
      line-height: 1.2; margin: 0 0 14px; }
    .skyline-device-card p { color: #b8cbb9; font-size: 15px; line-height: 1.7; margin: 0 0 24px; }
    .skyline-device-card a, .skyline-device-card button { display: inline-flex; justify-content: center;
      align-items: center; width: 100%; min-height: 48px; padding: 14px 18px; border-radius: 12px;
      background: #d4836a; color: #fff; text-decoration: none; font: inherit; font-weight: 700;
      border: 0; cursor: pointer; transition: background .2s ease, transform .2s ease; }
    .skyline-device-card a:hover, .skyline-device-card button:hover { background: #e59866; transform: translateY(-1px); }
    .skyline-device-card button.skyline-device-secondary { margin-top: 10px; background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.14); color: #b8cbb9; }
    .skyline-device-card button.skyline-device-secondary:hover { background: rgba(255,255,255,.14); color: #fff; }
    .skyline-device-note { display: block; margin-top: 16px; color: #829984; font-size: 12px; }
    @media (max-width: 420px) { .skyline-device-card { padding: 30px 22px; } }
  `;
  document.head.appendChild(style);

  if (mismatch) {
    const target = page === "desktop" ? "./mobile.html" : "./index.html";
    const heading = page === "desktop" ? "You're on a phone" : "You're on a desktop";
    const message = page === "desktop"
      ? "Skyline's desktop experience is not designed for phones yet. Some controls, panels, and playback features may not work as expected on a small screen. The mobile experience is still being built."
      : "This page is reserved for Skyline's mobile experience. The desktop layout may not behave correctly here. Switch to the desktop version for the full experience.";
    const button = page === "desktop" ? "Continue to mobile page" : "Go to desktop version";

    // Let visitors intentionally bypass the device warning and use the desktop layout.
    const desktopAnywayButton = document.getElementById("skyline-desktop-anyway");
    if (desktopAnywayButton) {
      desktopAnywayButton.addEventListener("click", () => gate.remove());
    }
    return;
  }

  if (page === "mobile") {
    document.getElementById("mobileComingSoon")?.removeAttribute("hidden");
  }
})();
