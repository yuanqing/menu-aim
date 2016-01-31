import babel from 'gulp-babel';
import del from 'del';
import gulp from 'gulp';
import runSequence from 'run-sequence';

gulp.task('build', (callback) => {
  runSequence(
    'build:clean',
    'build:build',
    callback
  );
});

gulp.task('build:clean', () => {
  return del('lib');
});

gulp.task('build:build', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});
