/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

/* eslint-disable */

const path = require("path");
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';

// Install `electron-debug` with `devtron`
require('electron-debug')({ showDevTools: true })

const { BrowserWindow } = require("electron");

// Install `vue-devtools`
require('electron').app.on('ready', () => {
  try {
    // let installExtension = require('electron-devtools-installer')
    installExtension(VUEJS_DEVTOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
    // BrowserWindow.addDevToolsExtension(path.resolve(__dirname, "../../extensions/chrome"));
    // installExtension.default(installExtension.VUEJS_DEVTOOLS)
    //   .then(() => {})
    //   .catch(err => {
    //     console.log('Unable to install `vue-devtools`: \n', err)
    //   })
  }catch(err) {
    
  }
  
})

// Require `main` process to boot app
require('./index')