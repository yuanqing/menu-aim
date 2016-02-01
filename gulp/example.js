import ecstatic from 'ecstatic';
import gulp from 'gulp';
import gutil from 'gulp-util';
import http from 'http';
import nopt from 'nopt';
import opn from 'opn';

gulp.task('example', ['watch'], () => {
  http.createServer(ecstatic({
    root: './'
  })).listen(4242);
  const args = nopt({
    open: Boolean
  }, {
    o: ['--open']
  });
  if (args.open) {
    const url = 'http://localhost:4242/example';
    gutil.log(gutil.colors.green('Opening', url));
    opn(url, {
      app: 'google chrome',
      wait: false
    });
  }
});
