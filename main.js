const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, Menu, BrowserWindow, Tray, ipcMain, dialog } = electron;
var exitprompt = true;

let tray = null;
let SettingsWindow = null;
let ReminderWindow = null;
var Selectedvalue = 5000;

var test = false;

// Don't close the app even if all windows are closed
app.on('window-all-closed', (e) => {
  e.preventDefault();
});


app.on('ready', () => {
  tray = new Tray('assets/icons/exercise.ico')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings', type: 'normal',
      click() {
        createSettingsWindow();
      }
    },
    {
      label: 'Quit', type: 'normal',
      click() {
        app.quit();
      }
    },
  ])
  tray.setToolTip('Exercise Reminder V1.0');
  tray.setContextMenu(contextMenu);

  // Start running reminder notifications as long as settingswindow is null (at the start and when it is closed)
  var re = setInterval(function () {
    while (SettingsWindow == null && ReminderWindow == null) {
      createReminderWindow();
    }
  }, Selectedvalue);

  ipcMain.on('selectedOption:select', function (e, selectedOption) {
    Selectedvalue = selectedOption * 60000;

    // Once user chooses an option, reset reminder cycle and run it with
    // user's option
    clearInterval(re);
    var re = setInterval(function () {
      while (SettingsWindow == null && ReminderWindow == null) {
        createReminderWindow();
      }
    }, Selectedvalue);

  });

});


// Create Reminder Window
function createReminderWindow() {
  ReminderWindow = new BrowserWindow({ width: 500, height: 300, frame: false, opacity: 0.8});
  ReminderWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ReminderWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Auto close Reminder after 10 seconds
  setTimeout(function () {
    ReminderWindow.hide();
    ReminderWindow = null;
  }, 11000);

}

// Create Settings Window
function createSettingsWindow() {
  SettingsWindow = new BrowserWindow({ width: 500, height: 300 });
  SettingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'SettingsWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  const settingsMenu = Menu.buildFromTemplate(settingsMenuTemplate);
  Menu.setApplicationMenu(settingsMenu);

  SettingsWindow.on('close', (e) => {
    if (exitprompt) {
      e.preventDefault();
      dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to close the app?'
      }, function (response) {
        if (response == 0) {
          exitprompt = false;
          app.quit();
        }
        else {
          SettingsWindow.setSkipTaskbar(true);
          SettingsWindow.minimize();
          SettingsWindow = null;
        }
      })
    }
  });

}

// Settings Window menu
const settingsMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  }
];

// enable production mode
if (process.env.NODE_ENV !== 'production') {
  settingsMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }]
  });
}