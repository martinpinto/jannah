"use strict";

require('sugar');
require('dotenv').load();

var async = require('async'),
  sftp = require("gulp-sftp"),
  gulp = require('gulp'),
  path = require('path'),
  fs   = require('fs'),
  gulpSSHHub = new (require('gulp-ssh'))({
    sshConfig : {
      host : process.env.HUB_HOST,
      username : 'root',
      privateKey : fs.readFileSync(process.env.SSH_KEY),
      passphrase : process.env.SSH_PASSWORD
    }
  }),
  gulpSSHMaster = new (require('gulp-ssh'))({
    sshConfig : {
      host : process.env.MASTER_HOST,
      username : 'root',
      privateKey : fs.readFileSync(process.env.SSH_KEY),
      passphrase : process.env.SSH_PASSWORD
    }
  }),
  sftpSettings = [{
    host : process.env.MASTER_HOST,
    user : 'root',
    key : {
      location : process.env.SSH_KEY,
      passphrase : process.env.SSH_PASSWORD,
    },
    remotePath : '/opt/jannah'
  }, {
    host : process.env.HUB_HOST,
    user : 'root',
    key : {
      location : process.env.SSH_KEY,
      passphrase : process.env.SSH_PASSWORD,
    },
    remotePath : '/opt/jannah'
  }],
  gulpSCP = require('gulp-scp2');

//There should be better way than copy-paste, could use async but
//gulp acts weird with callbacks and streams

gulp.task('uploadMaster', function(cb) {
 return gulp.src(['./**',
     '!./node_modules/**/*',
     '!./node_modules',
     '!**/.git/**',
     '!**/.git',
     '!./.DS_Store',
     '!./.env',
     '!./.gitignore'],{ dot : true })
  .pipe(sftp(sftpSettings[0]));
});

gulp.task('uploadHub', function(cb) {
 return gulp.src(['./**',
     '!./node_modules/**/*',
     '!./node_modules',
     '!**/.git/**',
     '!**/.git',
     '!./.DS_Store',
     '!./.env',
     '!./.gitignore'],{ dot : true })
  .pipe(sftp(sftpSettings[0]));
});

gulp.task('restartMaster', ['uploadMaster'], function() {
  return gulpSSHMaster
    .shell(['cd /opt/jannah', 'npm install', 'chmod +x bin/jannah', 'restart jannahMaster'])
    .pipe(gulp.dest('/tmp/jannah-deploy-logs'));
});

gulp.task('restartHub', ['uploadHub'], function() {
  return gulpSSHMaster
    .shell(['cd /opt/jannah', 'npm install', 'chmod +x bin/jannah', 'restart jannahHub'])
    .pipe(gulp.dest('/tmp/jannah-deploy-logs'));
});

gulp.task('default', ['restartHub', 'restartMaster']);
