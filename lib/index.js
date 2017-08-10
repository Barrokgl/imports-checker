const path = require('path');
const globby = require('globby');
const fs = require('fs');
const chalk = require('chalk');
const log = (color, ...a) => console.log(chalk[color](...a));

module.exports = function makeCheck(rootPath) {
    console.log(rootPath);
    const results = findBadImports(findAllFiles(rootPath));
    results.map(result => {
        if (result.badImports.length > 0) {
            log('red', `In file: ${result.filePath}`);
            result.badImports.map(imports =>
                log('red', `\t On line ${imports.line} - bad import: ${imports.shortImportPath} (${imports.fullImportPath})`));
            log('gray', '');
        }
    });
    log('blue', `Total files: ${results.length}`);
};

function findAllFiles(rootPath) {
    return globby.sync(
        [
            `${path.resolve(rootPath)}/**/*.ts`,
            `${path.resolve(rootPath)}/**/*.tsx`,
            `${path.resolve(rootPath)}/**/*.d.ts`,
            '!**/node_modules/**'
        ]
    );
}

function findBadImports(files) {
    return files.map(filePath => {
        const file = fs.readFileSync(filePath, {encoding: 'utf-8'});

        const badImports = file.split('\n')
            .map((row, i) => ({line: i + 1, text: row}))
            .filter(row => row.text.includes(' from '))
            .map(row => ({line: row.line, text: row.text.substr(row.text.indexOf('from') + 5).replace(/'|;|"/g, '')}))
            .filter(row => row.text.includes('/') && row.text.includes('.'))
            .map(row => {
                let source = filePath.substring(0, filePath.lastIndexOf('/') + 1);

                const bad = globby.sync([
                    path.resolve(source, row.text + '.ts'),
                    path.resolve(source, row.text + '.tsx'),
                    path.resolve(source, row.text + '/index.ts'),
                    path.resolve(source, row.text + '/index.tsx'),
                    path.resolve(source, row.text + '.d.ts'),
                ]);

                if (bad.length < 1) {
                    return {
                        shortImportPath: row.text,
                        fullImportPath: path.resolve(source, row +  '.ts'),
                        line: row.line
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
