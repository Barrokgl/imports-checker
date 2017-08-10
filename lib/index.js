const path = require('path');
const globby = require('globby');
const fs = require('fs');

module.exports = function makeCheck(rootPath) {
    console.log(findBadImports(findAllFiles(rootPath)));
};

function findAllFiles(rootPath) {
    return globby.sync([`${path.resolve(rootPath)}/**/*.ts`])
        .filter(dir => !~dir.indexOf('node_modules'));
}

function findBadImports(files) {
    return files.map(filePath => {
        const file = fs.readFileSync(filePath, {encoding: 'utf-8'});

        return file.split('\n')
            .filter(row => row.includes('from'))
            .map(row => row.substr(row.indexOf('from') + 5).replace(/'|;/g, ''))
            .filter(row => row.includes('/') && row.includes('.'))
            .map(row => {
                let source = files[0].substring(0, files[0].lastIndexOf('/') + 1);
                try {
                    fs.accessSync(path.resolve(source, row +  '.ts'));
                } catch (err) {
                    return 'Bad path: ' + path.resolve(source, row +  '.ts');
                }
            });
    });
}