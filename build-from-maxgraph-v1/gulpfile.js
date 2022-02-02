const {
    src,
    dest,
    parallel,
    series,
    watch
} = require('gulp');

const gulpSass = require('gulp-sass');
const sass = require('sass');
const mainSass = gulpSass(sass);

const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');

const notify = require('gulp-notify');

const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');

const svgSprite = require('gulp-svg-sprite');

const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

const fs = require('fs');
const del = require('del');

const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;

const styles = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(mainSass({
                outputStyle: 'compressed'
            })
            .on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min',
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2,
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/css'))
        .pipe(browserSync.stream());
}

const htmlInclude = () => {
    return src(['./src/index.html'])
        .pipe(fileinclude({
            prefix: '@',
            base: '@file',
        }))
        .pipe(dest('./app'))
        .pipe(browserSync.stream());
}

const scripts = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: "defaults"
                                }]
                            ]
                        }
                    }
                }]
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(uglify().on('error', notify.onError()))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/js'))
        .pipe(browserSync.stream());
}

const imgToApp = () => {
    return src([
            './src/img/**/*.jpg',
            './src/img/**/*.jpeg',
            './src/img/**/*.png',
        ])
        .pipe(dest('./app/img'));
}

const svgSprites = () => {
    return src('./src/img/**/*.svg')
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: "../sprite.svg"
                    }
                }
            })
        )
        .pipe(dest('./app/img'))
}

const resources = () => {
    return src('./src/resources/**')
        .pipe(dest('./app'));
}

const fonts = () => {
    src('./src/fonts/**/**.ttf')
        .pipe(ttf2woff())
        .pipe(dest('./app/fonts'));

    return src('./src/fonts/**/**.ttf')
        .pipe(ttf2woff2())
        .pipe(dest('./app/fonts'));
}

const cb = () => {}

let srcFonts = './src/scss/_fonts.scss';
let appFonts = './app/fonts/';

const fontsStyle = (done) => {
    let file_content = fs.readFileSync(srcFonts);

    fs.writeFile(srcFonts, '', cb);
    fs.readdir(appFonts, function (err, items) {
        if (items) {
            let c_fontname;
            for (var i = 0; i < items.length; i++) {
                let fontname = items[i].split('.');
                fontname = fontname[0];
                if (c_fontname != fontname) {
                    fs.appendFile(srcFonts, '@include font-face("' + fontname + '", "' + fontname + '", 400);\r\n', cb);
                }
                c_fontname = fontname;
            }
        }
    })

    done();
}

const clean = () => {
    return del(['./app/*']);
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: './app',
        }
    })

    watch('./src/scss/**/*.scss', styles);
    watch('./src/index.html', htmlInclude);
    watch('./src/**/*.jpg', imgToApp);
    watch('./src/**/*.jpeg', imgToApp);
    watch('./src/**/*.png', imgToApp);
    watch('./src/**/*.svg', svgSprites);
    watch('./src/resources/**', resources);
    watch('./src/fonts/**/**.ttf', fonts);
    watch('./src/fonts/**', fontsStyle);
    watch('./src/js/**/**.js', scripts);
}

exports.styles = styles;
exports.watchFiles = watchFiles;

exports.default = series(clean, parallel(htmlInclude, scripts, imgToApp, svgSprites, resources, fonts), fontsStyle, styles, watchFiles);

const stylesBuild = () => {
    return src('./src/scss/**/*.scss')
        .pipe(mainSass({
                outputStyle: 'compressed'
            })
            .on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min',
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2,
        }))
        .pipe(dest('./app/css'));
}

const scriptsBuild = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: "defaults"
                                }]
                            ]
                        }
                    }
                }]
            }
        }))
        .pipe(uglify().on('error', notify.onError()))
        .pipe(dest('./app/js'));
}

exports.build = series(clean, parallel(htmlInclude, scriptsBuild, imgToApp, svgSprites, resources, fonts), fontsStyle, stylesBuild, watchFiles);