import eslint from 'gulp-eslint';
import gulp from 'gulp';

gulp.task('lint', () => {
  const files = [
    __filename,
    'gulp/**/*.js',
    'src/**/*.js'
  ];
  return gulp.src(files)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});
