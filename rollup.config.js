export default {
    entry: 'npmdist/dist/index.js',
    dest: 'npmdist/bundles/mydatepicker.umd.js',
    format: 'umd',
    moduleName: 'mydatepicker',
    sourceMap: true,
    globals: {
        '@angular/core': 'ng.core',
        '@angular/common': 'ng.common',
        '@angular/forms': 'ng.forms',
        '@angular/compiler': 'ng.compiler',
        '@angular/platform-browser': 'ng.platformBrowser',
        '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic',
        '@angular/material': 'ng.material'
    },
    context: 'window',
    external: ['@angular/core', '@angular/forms', '@angular/common', '@angular/material', 'rxjs/Rx', 'rxjs/add/observable/fromEvent', 'rxjs/add/operator/pairwise', 'rxjs/add/operator/map', 'rxjs/add/operator/filter']
}