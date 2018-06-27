import {DIST_ROOT} from '../constants';
import {cleanTask} from '../util/task_helpers';

let gulp = require('gulp');

/** Remove the dist directory */
gulp.task(':clean', cleanTask(DIST_ROOT));

/** Removes redundant spec files from the release. TypeScript creates definition files for specs. */
gulp.task(':build:release:clean-spec', cleanTask('dist/**/*+(-|.)spec.*'));
