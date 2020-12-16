'use strict';

const D3Node = require('d3-node');
const { generateRadarChart, generateRadarImage } = require('./utils');

function RadarChart (data, options, {
    selector: _selector = ".radar-chart-node",
    svgStyle: _svgStyle = `
        .arc text {font: 10px sans-serif; text-anchor: middle;}
        .arc path {stroke: #fff;}
    `,
    container: _container = `<div style="display: flex; justify-content: center; width: 100%; height: 100%;align-items:center;" class="radar-chart-node"></div>`,
    radius: _radius = 150
} = { }) {
    const d3n = new D3Node({
        selector: _selector,
        styles: _svgStyle,
        container: _container
    });

    const { d3 } = d3n;

    let radius = _radius;

    d3.arc().outerRadius(radius - 10).innerRadius(0);
    d3.arc().outerRadius(radius - 40).innerRadius(radius - 40);
    d3.pie().sort(null).value((d) => d.value);

    let svg = d3n.createSVG()
        .attr('width', options.w)
        .attr('height', options.h)
        .append('g')
        .attr('transform', `translate( ${radius} , ${radius} )`);

        // Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
    const wrap = (text, width) => {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    };//wrap

    const cfg = {
        w: 450,				    // Width of the circle
        h: 350,				    // Height of the circle
        margin: {
            top: 50, right: 80, bottom: 50, left: 80
        },                      // The margins of the SVG (or number for all side margin)
        levels: 10,			    // How many levels or inner circles should there be drawn
        maxValue: 10, 			// What is the value that the biggest circle will represent
        labelFactor: 1.25, 	    // How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		    // The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35,  	// The opacity of the area of the blob
        dotRadius: 4, 			// The size of the colored circles of each blog
        opacityCircles: 0.1, 	// The opacity of the circles of each blob
        strokeWidth: 1, 		// The width of the stroke around each blob
        roundStrokes: false,	// If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal(d3.schemeCategory10),	// Color function
        format: '.0f',          // Format default is .0f (%,...)
        unit: '',               // Unit value (ex: $)
        legend: false           // Format: { title: string, translateX: number, translateY: number }
    };
    // mapping key from options to cfg
    if('undefined' !== typeof options){
        for(var i in options){
            if('undefined' !== typeof options[i]) { 
                cfg[i] = options[i]; 
            }
        }// for i
    };// if

    // if options.margin is a number
    if (typeof options.margin === 'number') {
        cfg.margin = {
            top: options.margin,
            right: options.margin,
            bottom: options.margin,
            left: options.margin
        }
    }; // if

    // if options.color
    if (options.color) {
        cfg.color = d3.scaleOrdinal().range(options.color);
    }; // if

    // If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = 0;
    for (let j=0; j < data.length; j++) {
        for (let i = 0; i < data[j].axes.length; i++) {
            data[j].axes[i]['id'] = data[j].name;
            if (data[j].axes[i]['value'] > maxValue) {
                maxValue = data[j].axes[i]['value'];
            };
        };
    };
    maxValue = Math.max(cfg.maxValue, maxValue);

    const allAxis = data[0].axes.map((i, j) => i.axis),	//Names of each axis
        total = allAxis.length,					//The number of different axes
        Format = d3.format(cfg.format),			 	//Formatting
    angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
    radius = Math.min(cfg.w/2, cfg.h/2); 	//Radius of the outermost circle


    //Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    //-------------------------------------------------------
    //Create the container SVG and g ------------------------
    //-------------------------------------------------------
    const parent = d3.select(d3n.document.querySelector(_selector));

    //Remove whatever chart with the same id/class was present before
    parent.select("svg").remove();

    //Initiate the radar chart SVG
    svg = parent.append("svg")
            .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
            .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
            .attr("class", "radar");

    //Append a g element
    let g = svg.append("g")
            .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

    //-------------------------------------------------------
    // Glow filter for some extra pizzazz -------------------
    //-------------------------------------------------------

    //Filter for the outside glow
    let filter = g.append('defs').append('filter').attr('id','glow')
    filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur')
    
    let feMerge = filter.append('feMerge')
        feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMerge.append('feMergeNode').attr('in','SourceGraphic');

    //-------------------------------------------------------
    // Draw the Circular grid -------------------------------
    //-------------------------------------------------------

    //Wrapper for the grid & axes
    let axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
    .data(d3.range(1,(cfg.levels+1)).reverse())
    .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#fff")
        .style("stroke", "rgb(130 127 127)")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1,(cfg.levels+1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .attr("fill", "#737373")
        .text(d => Format(maxValue * d / cfg.levels) + cfg.unit);

    //-------------------------------------------------------
    // Draw the axes-----------------------------------------
    //-------------------------------------------------------

    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue *1.1) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y2", (d, i) => rScale(maxValue* 1.1) * Math.sin(angleSlice * i - Math.PI/2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d,i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y", (d,i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI/2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    //-------------------------------------------------------
    // Draw the radar chart blobs----------------------------
    //-------------------------------------------------------

    //The radial line function
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((_d,i) => i * angleSlice);

    if(cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed)
    }

    //Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.axes))
        .style("fill", (d,i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function(d, i) {
			//Dim all blobs
			parent.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1);
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);
		})
		.on('mouseout', () => {
			//Bring back all blobs
			parent.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});

    //Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d.axes); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d,i) => cfg.color(i))
        .style("fill", "none")
        .style("filter" , "url(#glow)");

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d.axes)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2))
        .style("fill", (d) => cfg.color(d.id))
        .style("fill-opacity", 1);

    //-------------------------------------------------------
    // Append invisible circles for tooltip -----------------
    //-------------------------------------------------------

    //Wrapper for the invisible circles on top
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
        .attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
        .style("fill", "none")
        .style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			tooltip
				.attr('x', this.cx.baseVal.value - 10)
				.attr('y', this.cy.baseVal.value - 10)
				.transition()
				.style('display', 'block')
				.text(Format(d.value) + cfg.unit);
		})
		.on("mouseout", function(){
			tooltip.transition()
				.style('display', 'none').text('');
		});

	const tooltip = g.append("text")
		.attr("class", "tooltip")
		.attr('x', 0)
		.attr('y', 0)
		.style("font-size", "12px")
		.style('display', 'none')
		.attr("text-anchor", "middle")
        .attr("dy", "0.35em");
        
    if (cfg.legend !== false && typeof cfg.legend === "object") {
        let legendZone = svg.append('g');
        let names = data.map(el => el.name);
        if (cfg.legend.title) {
            legendZone.append("text")
                .attr("class", "title")
                .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`)
                .attr("x", cfg.w - 70)
                .attr("y", 10)
                .attr("font-size", "12px")
                .attr("fill", "#404040")
                .text(cfg.legend.title);
        }
        let legend = legendZone.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY + 20})`);
        // Create rectangles markers
        legend.selectAll('rect')
        .data(names)
        .enter()
        .append("rect")
        .attr("x", cfg.w - 65)
        .attr("y", (d,i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", (d,i) => cfg.color(i));
        // Create labels
        legend.selectAll('text')
        .data(names)
        .enter()
        .append("text")
        .attr("x", cfg.w - 52)
        .attr("y", (d,i) => i * 20 + 9)
        .attr("font-size", "11px")
        .attr("fill", "#737373")
        .text(d => d);
    }

    return d3n;
};

module.exports = {
    // main function 
    RadarChart, 

    // prototype
    generateRadarChart, 
    generateRadarImage 
};