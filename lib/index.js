const path = require('path');
const globby = require('globby');
const fs = require('fs');
const chalk = require('chalk');
const log = (color, ...a) => console.log(chalk[color](...a));

module.exports = function makeCheck(rootPath) {
    const results = findBadImports(findAllFiles(rootPath));
    results.map(result => {
        if (result.badImports.length > 0) {
            log('red', `In file: ${result.filePath}`);
            result.badImports.map(imports =>
                log('red', `Bad import: ${imports.shortImportPath} (${imports.fullImportPath})`));
        }
    });
    log('blue', `Total files: ${results.length}`);
};

function findAllFiles(rootPath) {
    return globby.sync(
        [
            `${path.resolve(rootPath)}/**/*.ts`,
            `${path.resolve(rootPath)}/**/*.tsx`,
            `${path.resolve(rootPath)}/**/*.d.ts`
        ]
    ).filter(dir => !~dir.indexOf('node_modules'));
}

function findBadImports(files) {
    return files.map(filePath => {
        const file = fs.readFileSync(filePath, {encoding: 'utf-8'});

        const badImports = file.split('\n')
            .filter(row => row.includes(' from '))
            .map(row => row.substr(row.indexOf('from') + 5).replace(/'|;/g, ''))
            .filter(row => row.includes('/') && row.includes('.'))
            .map(row => {
                let source = filePath.substring(0, filePath.lastIndexOf('/') + 1);

                const bad = globby.sync([
                    path.resolve(source, row + '.ts'),
                    path.resolve(source, row + '.tsx'),
                    path.resolve(source, row + '/index.ts'),
                    path.resolve(source, row + '/index.tsx'),
                    path.resolve(source, row + '.d.ts'),
                ]);

                if (bad.length < 1) {
                    return {
                        shortImportPath: row,
                        fullImportPath: path.resolve(source, row +  '.ts'),
                    };
                }

            }).filter(badImport => typeof badImport !== 'undefined');

        if (badImports.length > 0) {
            return {
                filePath,
                badImports
            }
        }

    }).reduce((acc, array) => array ? acc.concat(array) : acc , []);
}