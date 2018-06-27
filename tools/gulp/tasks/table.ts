let gulp = require('gulp');
const rename = require('gulp-rename');

import {ModuleKind, ScriptTarget} from 'typescript';
import * as path from 'path';

import {HTML_MINIFIER_OPTIONS, PROJECT_ROOT, TABLE_DIR, TABLE_DIST_ROOT, TABLE_LICENSE_BANNER,} from '../constants';
import {execNodeTask, sassBuildTask, triggerLiveReload, tsBuildTask,} from '../util/task_helpers';

// There are no type definitions available for these imports.
const inlineResources = require('../../../scripts/release/inline-resources');
const gulpRollup = require('gulp-better-rollup');
const gulpMinifyHtml = require('gulp-htmlmin');
const gulpIf = require('gulp-if');

/** Path to tsconfig file for the ng2-smart-table. */
const tsconfigPath = path.join(TABLE_DIR, 'tsconfig.json');

/** Asset files to be added to the components output. */
const assetFiles = [
  path.join(TABLE_DIR, '**/*.html'),
  path.join(TABLE_DIR, '**/*.scss'),
  path.join(TABLE_DIR, 'package.json'),
  path.join(PROJECT_ROOT, 'README.md'),
  path.join(PROJECT_ROOT, 'LICENSE.txt'),
];

const ROLLUP_GLOBALS = {
  // Angular dependencies
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  '@angular/common/http': 'ng.common.http',
  '@angular/forms': 'ng.forms',
  '@angular/router': 'ng.router',
  '@angular/http': 'ng.http',
  '@angular/animations': 'ng.animations',
  '@angular/animations/browser': 'ng.animations.browser',
  '@angular/platform-browser': 'ng.platformBrowser',
  '@angular/platform-browser/animations': 'ng.platformBrowser.animations',
  '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic',

  // Rxjs dependencies
  'rxjs': 'Rx',
  'rxjs/operators': 'Rx.operators',

  // 3rd party dependencies
  'ng2-completer': 'ng2completer',
  'lodash': 'lodash',
};


/** Creates a rollup bundles of the ng2-smart-table components.*/
function createRollupBundle(format: string, outFile: string) {
  const rollupOptions = {
    context: 'this',
    external: Object.keys(ROLLUP_GLOBALS),
  };

  const rollupGenerateOptions = {
    // Keep the moduleId empty because we don't want to force developers to a specific moduleId.
    moduleId: '',
    moduleName: 'ng2-smart-table',
    banner: TABLE_LICENSE_BANNER,
    format: format,
    dest: outFile,
    globals: ROLLUP_GLOBALS,
  };

  return gulpRollup(rollupOptions, rollupGenerateOptions);
}

/** Builds components typescript in ES5, ES6 target. For specs Karma needs CJS output. */
gulp.task(':build:table:ts:es5', tsBuildTask(tsconfigPath, {target: ScriptTarget.ES5}));
gulp.task(':build:table:ts:es6', tsBuildTask(tsconfigPath, {target: ScriptTarget.ES2015}));
gulp.task(':build:table:ts:spec', tsBuildTask(tsconfigPath, {
  target: ScriptTarget.ES5, module: ModuleKind.CommonJS,
}));

/** Build table tasks */
gulp.task('build:table', triggerLiveReload);
gulp.task(':build:table:metadata',
  execNodeTask('@angular/compiler-cli', 'ngc', ['-p', tsconfigPath])
);

/** [Watch task] Rebuilds (ESM output) whenever ts, scss, or html sources change. */
gulp.task(':gulp.watch:table', () => {
  gulp.watch(path.join(TABLE_DIR, '**/*.ts'), gulp.series('build:table'));
  gulp.watch(path.join(TABLE_DIR, '**/*.scss'), gulp.series('build:table'));
  gulp.watch(path.join(TABLE_DIR, '**/*.html'), gulp.series('build:table'));
});

/** Compiles the components SCSS into minified CSS. */
gulp.task(':build:table:scss', sassBuildTask(TABLE_DIST_ROOT, TABLE_DIR, true));

/** Builds a UMD bundle (ES5) for all components. */
gulp.task(':build:table:rollup:umd', () => {
  return gulp.src(path.join(TABLE_DIST_ROOT, 'index.js'))
    .pipe(createRollupBundle('umd', 'table.umd.js'))
    .pipe(rename('table.umd.js'))
    .pipe(gulp.dest(path.join(TABLE_DIST_ROOT, 'bundles')));
});

/** Builds a ES6 bundle for all components. */
gulp.task(':build:table:rollup:esm', () => {
  return gulp.src(path.join(TABLE_DIST_ROOT, 'index.js'))
    .pipe(createRollupBundle('es', 'table.js'))
    .pipe(rename('table.js'))
    .pipe(gulp.dest(path.join(TABLE_DIST_ROOT, 'bundles')));
});

/** Copies all component assets to the build output. */
gulp.task(':build:table:assets', () => {
  return gulp.src(assetFiles)
    .pipe(gulpIf(/.html$/, gulpMinifyHtml(HTML_MINIFIER_OPTIONS)))
    .pipe(gulp.dest(TABLE_DIST_ROOT));
});


/** Inlines resources (html, css) into the JS output. */
gulp.task(':inline-resources', () => inlineResources(TABLE_DIST_ROOT));

/** Generates metadata.json files for all of the components. */
gulp.task(':build:table:ngc', gulp.series(':build:table:metadata'));

/** Builds components with resources (html, css) inline into the built JS. */
gulp.task(':build:table:inline',
  gulp.series(gulp.parallel(':build:table:scss', ':build:table:assets'), ':inline-resources')
);

/** Tasks to create a UMD or ES bundle */
gulp.task(':build:table:bundle:umd',
  gulp.series(':build:table:ts:es5', ':build:table:ngc', ':build:table:inline', ':build:table:rollup:umd')
);

/** Builds components to UMD bundle. */
gulp.task('build:table', gulp.series(':build:table:bundle:umd'));

gulp.task(':build:table:bundle:esm',
  gulp.series(':build:table:ts:es6', ':build:table:inline', ':build:table:rollup:esm')
);

/** Builds components for ng2-smart-table releases */
gulp.task(':build:table:release', gulp.series(':build:table:bundle:esm', ':build:table:bundle:umd'));


