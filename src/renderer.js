const { ipcRenderer } = require('electron');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const countdownElement = document.getElementById('countdown');
const containerElement = document.getElementById('container');
const intervalMinutes = document.getElementById('intervalMinutes');
const setIntervalBtn = document.getElementById('setIntervalBtn');
const notificationAlert = document.getElementById('notification-alert');
const notificationMessage = document.getElementById('notification-message');
const notificationTime = document.getElementById('notification-time');
const dismissBtn = document.getElementById('dismissBtn');

function formatTimeRemaining(ms) {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

startBtn.addEventListener('click', () => {
  ipcRenderer.send('start-timer');
});

stopBtn.addEventListener('click', () => {
  ipcRenderer.send('stop-timer');
  countdownElement.textContent = '00:00:00';
});

setIntervalBtn.addEventListener('click', () => {
  const minutes = parseInt(intervalMinutes.value, 10);
  if (minutes && minutes > 0 && minutes <= 180) {
    ipcRenderer.send('set-timer-duration', minutes);
  }
});

dismissBtn.addEventListener('click', () => {
  notificationAlert.classList.add('hidden');
  ipcRenderer.send('reset-notifications');
});

ipcRenderer.on('timer-status', (event, isActive) => {
  if (isActive) {
    containerElement.classList.add('timer-ticking');
  } else {
    containerElement.classList.remove('timer-ticking');
  }
});


ipcRenderer.on('countdown-update', (event, timeRemaining) => {
  countdownElement.textContent = formatTimeRemaining(timeRemaining);
});

ipcRenderer.on('notification-received', (event, data) => {
  notificationAlert.classList.remove('hidden');
  if (data.count > 1) {
    notificationMessage.textContent = `It's time to drink some water! (${data.count} reminders)`;
  } else {
    notificationMessage.textContent = 'It\'s time to drink some water!';
  }
  
  notificationTime.textContent = `Last reminder: ${formatTimestamp(data.timestamp)}`;
});

ipcRenderer.on('notifications-reset', () => {
  notificationAlert.classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('renderer-ready');
});


document.addEventListener('DOMContentLoaded', () => {
  const collapsibleBox = document.querySelector('.collapsible-box');
  const collapsibleHeader = document.querySelector('.collapsible-header');

  collapsibleHeader.addEventListener('click', () => {
    collapsibleBox.classList.toggle('active');
  });
});