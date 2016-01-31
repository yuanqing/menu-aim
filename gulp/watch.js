import gulp from 'gulp';

gulp.task('watch', ['build:clean'], () => {
  gulp.watch('src/**/*.js', ['build:build']);
});
