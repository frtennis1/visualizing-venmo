

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
    this.data = _data;
    this.prefilteredData = this.data;
    this.filteredData = this.data;
    this.displayData = []; // see data wrangling

    this.timeScale = "yearly";
    this.userId = null;

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

	// Overlay with path clipping
    vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0, vis.width])
        .domain([1,53]);

    vis.color = d3.scaleOrdinal()
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%U")(d)))
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
    var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var categories = ["Food", "Drinks", "Drugs", "Transportation", "Sex", "Other", "Events"];

    // Filter by user
    if (vis.userId) {
        vis.filteredData = vis.data.filter(d => d.from == vis.userId || d.to == vis.userId);
    } else {
        vis.filteredData = vis.data;
    }

    // Filter by keyword
    var keyword = d3.select("#keywordInput").node().value;
    if (keyword == "") {
        vis.filteredData = vis.filteredData;
    } else {
        vis.filteredData = vis.filteredData.filter(d => d.message.toLowerCase().includes(keyword.toLowerCase()));
    }

    // Choose weekly or yearly
    var timeKey;
    var domainLength;
    if (vis.timeScale == "yearly") {
        timeKey = d => +d3.timeFormat("%U")(d.created_time);
        domainLength = 54;
    }
    else if (vis.timeScale == "weekly") {
        timeKey = d => +d3.timeFormat("%w")(d.created_time);
        domainLength = 7;
    }
    else if (vis.timeScale == "monthly") {
        timeKey = d => +d3.timeFormat("%m")(d.created_time);
        domainLength = 12;
    }

    // Nest the data by week and category
	vis.nestedData = d3.nest()
	    .key(timeKey)
        .sortKeys(d3.ascending)
	    .key(d => d.category)
	    .rollup(d => d.length)
	    .entries(vis.filteredData);

	// Flatten the data
    vis.flatData = new Array(domainLength);
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
        vis.flatData[d.key] = row;
    });

    // Fill all gaps of the data
    for (var i = 0; i < domainLength; i++) {
        if (typeof vis.flatData[i] != 'undefined') {
            continue;
        }
        var entry = { week: i };
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

    // Update the x axis
    if (vis.timeScale == 'yearly') {
        vis.x.domain([0,53]);
        vis.xAxis.ticks(4)
            .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%U")(d)));
        vis.area.curve(d3.curveMonotoneX);
    } else if (vis.timeScale == 'weekly') {
        var dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        vis.x.domain([0,7]);
        vis.xAxis.ticks(7)
            .tickFormat(d => dayOfWeek[d % 7]);
        vis.area.curve(d3.curveStepAfter);
        // Add a transactionless 8th day to let the curve render the 7th day correctly
        for (var i = 0; i < vis.displayData.length; i++) {
            var filler = [0,0];
            filler.data = { week: 7 };
            vis.displayData[i].push(filler);
        }
    }
    else if (vis.timeScale == 'monthly') {
        var monthOfYear = ["January", "Febrary"]
        vis.x.domain([1,13]);
        vis.xAxis.ticks(12)
            .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%m")(d)));
        vis.area.curve(d3.curveStepAfter);
        // Add a transactionless 13th day to let the curve render the 7th day correctly
        for (var i = 0; i < vis.displayData.length; i++) {
            var filler = [0,0];
            filler.data = { week: 13 };
            vis.displayData[i].push(filler);
        }
    }

    // Draw the layers
    var categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .merge(categories)
        .transition().duration(400)
        .attr("opacity", 0)
        .transition().duration(0)
        .style("fill", function(d,i) {
            return categoriesColorScale(d.key);
        })
        .attr("d", function(d) {
            return vis.area(d);
        })
        .attr("data-key", function(d) { return d.key; })
        .transition().duration(400)
        .attr("opacity", 1);

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
	vis.svg.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45) translate(-7,-5)")
        .attr("text-anchor", "end");
    vis.svg.select(".y-axis").transition().duration(800).call(vis.yAxis);
}

StackedAreaChart.prototype.display = function(timeScale) {
    var vis = this;
    if (vis.timeScale == timeScale) {
        return;
    }
    vis.timeScale = timeScale;
    vis.wrangleData();
}

StackedAreaChart.prototype.filterForUser = function(userId) {
    var vis = this;
    vis.userId = userId;
    vis.wrangleData();
}
