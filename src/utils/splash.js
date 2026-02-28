/**
 * Dismiss native Capacitor splash, then trigger the animated CSS/SMIL splash.
 */
export async function initSplash() {
  try {
    if (window.Capacitor?.Plugins?.SplashScreen) {
      await window.Capacitor.Plugins.SplashScreen.hide();
    }
  } catch (e) {
    // No native splash to dismiss (browser)
  }

  const splash = document.getElementById('splash');
  if (!splash) return;

  splash.classList.add('active');

  const start = (sel, delay) =>
    setTimeout(() => {
      const el = document.querySelector(sel);
      if (el) el.beginElement();
    }, delay);

  start('.anim-bar1', 0);
  start('.anim-bar2', 160);
  start('.anim-bar3', 320);
  start('.anim-bar4', 480);
  start('.anim-strike', 740);
  start('.anim-reveal', 1340);
  start('.anim-fade', 1460);

  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => (splash.style.display = 'none'), 500);
  }, 2600);
}
