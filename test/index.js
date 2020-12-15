const d3 = require('d3-node')().d3;
const { RadarChart, generateRadarChart, generateRadarImage} = require('../');

const data = [{ 
    name: 'Allocated budget',
    axes: [
        {axis: 'Sales', value: 4},
        {axis: 'Marketing', value: 5},
        {axis: 'Development', value: 2},
        {axis: 'Customer Support', value: 1},
        {axis: 'Information Technology', value: 8},
        {axis: 'Administration', value: 5},
        {axis: 'Administration', value: 2},
        {axis: 'Administration', value: 5}
    ],
    color: '#26AF32'
}];

const radar = RadarChart(data, {
    w: 450,
    h: 350,
    margin: {
        top: 50, right: 50, bottom: 50, left: 50 
    },
    maxValue: 10,
    levels: 10,
    roundStrokes: false,
    color: d3.scaleOrdinal().range(["#ff6600"]),
    legend: { title: 'Organization XYZ', translateX: 60, translateY: 0 }
})

// create output files
generateRadarChart(radar, 'html', { write: true, dest: './test' })
generateRadarImage(radar, 'png', {
    dest: './test'
})

