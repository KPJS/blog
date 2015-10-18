var ftp = require('vinyl-ftp');
var gulp = require('gulp');
var gutil = require('gulp-util');
var minimist = require('minimist');
var args = minimist(process.argv.slice(2));

gulp.task('deploy', function() {
  var remotePath = '/deploy_project/';
  var conn = ftp.create({
    host: args.address,
    user: args.user,
    password: args.password, /*travis encrypt FTP_PASSWORD=*** --add*/
    log: gutil.log
  });
 
  gulp.src(['./**','!./node_modules','!./node_modules/**'])
    .pipe(conn.newer(remotePath))
    .pipe(conn.dest(remotePath));
});