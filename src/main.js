const { 
  app, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain
} = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let interval;
let countdownInterval;
let HOUR_IN_MS = 60 * 60 * 1000; // use a lower value for testing
let nextReminderTime = 0;
let notificationCount = 0;
let lastNotificationTime = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 420,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: {
      color: '#00FFFFFF', // Transparent or semi-transparent color
      symbolColor: '#FFFFFF', // Color for the close/minimize/maximize buttons
      height: 38 // Height of the title bar
    },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00ffffff',
    icon: path.join(__dirname, '../assets/icons/app-icon.icns'),
    // transparent: true,
  });

  // Add this line to remove the menu bar
  mainWindow.setMenuBarVisibility(false);

  // Add this after creating the BrowserWindow
  mainWindow.maximize();

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // Hide the app icon in the Dock
  // app.dock.hide();

  mainWindow.on('focus', () => {
    resetNotificationCount();
  });
  mainWindow.on('close', () => {
    app.quit();
  });
}
 
function createTray() {
  // custom tray icon
  const iconPath = path.join(__dirname, '../assets/icons/trayTemplate.png')
  const image = nativeImage.createFromPath(iconPath);
  if (process.platform === 'darwin') {
    image.setTemplateImage(true);
  }
  tray = new Tray(image);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow.show() },
    { label: 'Start timer', click: startTimer },
    { label: 'Stop timer', click: stopTimer },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Water Reminder');
  tray.setContextMenu(contextMenu);
  if (process.platform === 'darwin') {
    tray.setTitle('00:00');
  }
}

function startTimer() {
  if (interval) {
    clearInterval(interval);
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  nextReminderTime = Date.now() + HOUR_IN_MS;

  // Notify at start (?)
  // showNotification();

  interval = setInterval(() => {
    nextReminderTime = Date.now() + HOUR_IN_MS;
    showNotification();
  }, HOUR_IN_MS);
  startCountdown();
  if (mainWindow) {
    mainWindow.webContents.send('timer-status', true);
  }
}

function startCountdown() {
  // Update the countdown every second
  countdownInterval = setInterval(() => {
    if (mainWindow) {
      const timeRemaining = Math.max(0, nextReminderTime - Date.now());
      mainWindow.webContents.send('countdown-update', timeRemaining);
      if (process.platform === 'darwin' && tray) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        tray.setTitle(formattedTime);
      }
    }
  }, 1000);
}

function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  if (process.platform === 'darwin') {
    tray.setTitle('00:00');
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (mainWindow) {
    mainWindow.webContents.send('timer-status', false);
    mainWindow.webContents.send('countdown-update', 0);
  }
}

function showNotification() {
  notificationCount++;
  lastNotificationTime = Date.now();

  if (process.platform === 'darwin') {
    app.dock.setBadge(notificationCount.toString());
    app.dock.bounce('critical');
  }

  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('notification-received', {
      count: notificationCount,
      timestamp: lastNotificationTime
    });
  }

  const notification = new Notification({
    title: 'Water Reminder',
    body: 'It\'s time to drink some water!',
    silent: false,
    icon: path.join(__dirname, '../assets/icons/app-icon.icns')
  });

  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
}

function resetNotificationCount() {
  notificationCount = 0;
  
  // Remove the badge from the Dock
  if (process.platform === 'darwin') {
    app.dock.setBadge('');
  }
  
  // Notify the renderer process to reset the notification count
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('notifications-reset');
  }
}

ipcMain.on('start-timer', () => {
  startTimer();
});

ipcMain.on('stop-timer', () => {
  stopTimer();
});

ipcMain.on('set-timer-duration', (event, minutes) => {
  const duration = minutes * 60 * 1000;
  HOUR_IN_MS = duration;

  if (interval) {
    startTimer();
  }
});

ipcMain.on('renderer-ready', () => {
  startTimer(); // Start the timer when the renderer is ready
});

ipcMain.on('reset-notifications', () => {
  resetNotificationCount();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
