

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;
    this.displayData = []; // see data wrangling

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

StackedAreaChart.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

	vis.width = 400 - vis.margin.left - vis.margin.right;
    vis.height = 400 - vis.margin.top - vis.margin.bottom;


    // SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
       .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// TO-DO: Overlay with path clipping
    vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Scales and axes
    /*vis.x = d3.scaleTime()
        .range([0, vis.width])
        .domain(d3.extent(vis.data, function(d) {
            return parseDate(d.created_week);
        }));*/

    vis.x = d3.scaleLinear()
        .range([0, vis.width])
        .domain([1,53]);

    vis.color = d3.scaleOrdinal()
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%V")(d)))
        .ticks(4);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .append("text")
        .text("Number of Transactions")
        .attr("transform", "rotate(90,0,0) translate(108,-3)")
        .attr("fill", "black");

    vis.area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(d => vis.x(d.data.week))
        .y0(d => vis.y(d[0]))
        .y1(d => vis.y(d[1]));

    vis.svg.append("text")
        .attr("x", vis.width)
        .attr("y", 15)
        .attr("text-anchor", "end")
        .attr("class", "tool-tip");

    vis.wrangleData();
}



/*
 * Data wrangling
 */

StackedAreaChart.prototype.wrangleData = function(){
	var vis = this;

	// Constants
    var parseDate = d3.timeParse("%m/%d/%y %H:%M");
    var formatWeek = d3.timeFormat("%V");
    var categories = ["Food", "Drinks", "Drugs", "Transportation", "Sex", "Other", "Events"];

    // Nest the data by week and category
	vis.nestedData = d3.nest()
	    .key(function(d) {
            return +formatWeek(parseDate(d.created_time));
        })
        .sortKeys(d3.ascending)
	    .key(d => d.category)
	    .rollup(d => d.length)
	    .entries(vis.filteredData);

	// Flatten the data
    vis.flatData = new Array(52);
    vis.nestedData.forEach(function (d) {
        var row = {};
        row.week = +d.key;
        for (var i = 0; i < d.values.length; i++) {
            row[d.values[i].key] = d.values[i].value;
        }
        // Fill out 0 categories
        for (var i = 0; i < categories.length; i++) {
            if (!(categories[i] in row)) {
                row[categories[i]] = 0;
            }
        }
        vis.flatData[d.key-1] = row;
    });

    // Fill all gaps of the data
    for (var i = 0; i < 52; i++) {
        if (typeof vis.flatData[i] != 'undefined') {
            continue;
        }
        var entry = { week: 1+i };
        for (var j = 0; j < categories.length; j++) {
            entry[categories[j]] = 0;
        }
        vis.flatData[i] = entry;
    }

    // Stack the data
    vis.displayData = d3.stack()
        .keys(categories)
        (vis.flatData);

    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

StackedAreaChart.prototype.updateVis = function(){
	var vis = this;

	// Update the y axis
    var maxY = d3.max(vis.displayData, d => d3.max(d, f => f[1]));
    vis.y.domain([0, maxY]);

    // Draw the layers
    var categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .merge(categories)
        .transition().duration(800)
        .style("fill", function(d,i) {
            return vis.color(i);
        })
        .attr("d", function(d) {
            return vis.area(d);
        })
        .attr("data-key", function(d) { return d.key; });

    function mouseOver() {
        vis.svg.select(".tool-tip")
            .text(this.getAttribute("data-key"));
        vis.svg.selectAll(".area").attr("opacity", 0.5);
        d3.select(this).attr("opacity", 1);
    }
    function mouseOut() {
        vis.svg.selectAll(".area").attr("opacity", 1);
    }

	categories.exit().remove();

	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(800).call(vis.yAxis);
}

StackedAreaChart.prototype.filterForKeyword = function(keyword) {
    var vis = this;
    // Don't filter if there's no keyword (don't waste computation time)
    if (keyword == "") {
        vis.filteredData = vis.data;
    } else {
        vis.filteredData = vis.data.filter(d => d.message.toLowerCase().includes(keyword.toLowerCase()));
    }
    vis.wrangleData();
}