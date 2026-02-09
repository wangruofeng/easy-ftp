const path = require('path');
require('dotenv').config();

const DATA_ROOT = path.resolve(process.cwd(), process.env.DATA_ROOT || './data');
const FTP_PORT = parseInt(process.env.FTP_PORT || '2121', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const SITE_NAME = process.env.SITE_NAME || 'Pieter';
const FTP_HOST = process.env.FTP_HOST || 'localhost';

const WELCOME_LINES = [
  'This is a real FTP server with an anonymous login',
  '',
  `<ftp://${FTP_HOST}>`,
  '',
  "Unfortunately modern browsers don't support FTP",
  'anymore but you can still login with an FTP',
  'client',
  '',
  "I'll use it to store files for myself to",
  'transfer and to host stuff for the community',
  '',
  'This is a non-commercial project to induce',
  'nostalgia. But if you want to remove your',
  'files from here: msg me x.com/levelsio',
  'and I will of course!',
  '',
  'Last updated:',
  null, // 占位，运行时替换为当前时间
  '',
  'See my main site at pieter.com',
  '',
];

module.exports = {
  DATA_ROOT,
  FTP_PORT,
  HTTP_PORT,
  SITE_NAME,
  FTP_HOST,
  WELCOME_LINES,
};
