/**
 * Created by Administrator on 2016-10-17.
 */
const {remote} = require('electron');
const {BrowserWindow,dialog,shell} = remote;

const fs = require('fs');

let print_win;

print_win = new BrowserWindow();
print_win.loadURL('file://' + __dirname + '/print.html');
print_win.show();
