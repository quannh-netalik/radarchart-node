'use strict';

const fs = require('fs');
const puppeteer = require('puppeteer');

const FILE_DESTINATION = './test';
const FILE_NAME = 'radar-chart';

const getFilePath = (dest, fileName, type) => dest + '/' + fileName + '.' + type;

exports.generateRadarChart = (d3n, type = 'svg', {
    write: _write,
    dest: _dest = FILE_DESTINATION,
    fileName: _fileName = FILE_NAME
} = {}) => { 
    try {
        // convert to svg & html
        const svgString = d3n.svgString();
        const html = d3n.html();

        // get the data to write & return
        const data = type === 'html' ? html : svgString;

        // get file path
        const file = getFilePath(_dest, _fileName, type);
        if (_write) fs.writeFile(`${file}`, data, function (err) {
            if (err) {
                console.error('ERROR!', err)
                process.exit(1)
            }
            console.log(`=======>> Exported "${file}", open in a web browser`);
        });

        return data;
    } catch(_e) {
        console.error('ERROR!', _e)
        process.exit(1)
    }
};

exports.generateRadarImage = (d3n, type = 'png', {
    width: _width,
    height: _height,
    quality: _quality,
    dest: _dest = FILE_DESTINATION,
    fileName: _fileName = FILE_NAME
} = { }) => {
    try {
        const viewport = _width && _height ? { _width, _height } : false;
        const html = d3n.html();
        
        const screenShotOptions = {
            viewport,
            path: getFilePath(_dest, _fileName, type),
            _quality,
            type
        };

        return puppeteer.launch()
            .then((browser) => {
                browser.newPage()
                    .then((page) => {
                        page.setContent(html)
                        if (viewport) {
                            page.setViewport(viewport);
                        }
                        page.screenshot(screenShotOptions)
                            .then(() => browser.close())
                            .then(() => console.log('=======>> Exported:', screenShotOptions.path))
                            .catch(err => {
                                console.error('ERROR!', err)
                                process.exit(1)
                            });
                    }) 
                    .catch(err => {
                        console.error('ERROR!', err)
                        process.exit(1)
                    });
            })
            .catch(err => {
                console.error('ERROR!', err)
                process.exit(1)
            });
    } catch(_e) {
        console.error('ERROR!', _e)
        process.exit(1)
    }
};