(() => {
  "use strict";

  const root = document.documentElement;
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const compactViewport = window.matchMedia("(max-width: 760px)");

  function updateDeviceInfo() {
    root.dataset.inputMode = coarsePointer.matches ? "touch" : "pointer";
    root.dataset.viewport = compactViewport.matches ? "compact" : "wide";
  }

  // CSS media queries handle the responsive layout. These attributes are
  // optional hints for scripts that need to adapt to the current device.
  updateDeviceInfo();

  coarsePointer.addEventListener("change", updateDeviceInfo);
  compactViewport.addEventListener("change", updateDeviceInfo);
})();
