import { Menu, Tray, app, nativeImage, type BrowserWindow } from "electron";

/**
 * The app's only visible sign of life.
 *
 * Since the widget starts hidden and closing it only hides it, without a tray
 * icon there is nothing on screen saying Upstream is running — notifications
 * would arrive from a program the user can't see, and there'd be no way to open
 * the widget again short of relaunching.
 */

/** Drawn rather than shipped as a file: one less asset to bundle and package,
 *  and it stays crisp because the OS rasterises the SVG at whatever size it
 *  wants. Matches the chevron mark used on the web. */
function trayIcon(): Electron.NativeImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="9" fill="#6744FF"/>
    <g stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M9 15.5 16 8.5 23 15.5"/>
      <path d="M9 23.5 16 16.5 23 23.5" opacity="0.45"/>
    </g>
  </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
}

export interface TrayState {
  signedIn: boolean;
  /** Minutes left in the running session, or null when none is active. */
  remainingMin: number | null;
  streak: number;
}

export function createTray(window: BrowserWindow, onQuit: () => void): (state: TrayState) => void {
  const tray = new Tray(trayIcon());
  tray.setToolTip("Upstream");

  const show = () => {
    window.show();
    window.focus();
  };

  // Left-click is the shortcut people reach for first on Windows; the menu is
  // for everything else.
  tray.on("click", show);

  function render(state: TrayState) {
    const status = !state.signedIn
      ? "Not signed in"
      : state.remainingMin !== null
        ? `Session running — ${state.remainingMin} min left`
        : state.streak > 0
          ? `No session · ${state.streak} day streak`
          : "No session running";

    tray.setToolTip(`Upstream — ${status}`);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: status, enabled: false },
        { type: "separator" },
        { label: "Open Upstream", click: show },
        { type: "separator" },
        {
          label: "Quit",
          click: () => {
            onQuit();
            app.quit();
          },
        },
      ])
    );
  }

  render({ signedIn: false, remainingMin: null, streak: 0 });
  return render;
}
