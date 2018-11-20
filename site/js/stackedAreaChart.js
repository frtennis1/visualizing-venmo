

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = []; // see data wrangling

    this.initVis();
}

// var parseDate = d3.timeParse("%Y-%m-%d");

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
        .range([vis.height, 0])
        .domain([0,10000]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.area = d3.area()
            .curve(d3.curveCardinal)
            .x(d => vis.x(d.data.created_week))
            .y0(d => vis.y(d[0]))
            .y1(d => vis.y(d[1]));

    /*vis.svg.append("text")
        .attr("x", 10)
        .attr("y", 15)
        .attr("class", "tool-tip");*/

    vis.wrangleData();
}



/*
 * Data wrangling
 */

StackedAreaChart.prototype.wrangleData = function(){
	var vis = this;

    // Stacks transactions by category
    vis.displayData = d3.stack()
        .keys(['Sex','Drugs','Drinks','Sex','Other','Food','Events'])
        (vis.data);

    console.log(vis.displayData);

    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

StackedAreaChart.prototype.updateVis = function(){
	var vis = this;

    // Draw the layers
    var categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area")
        .merge(categories)
        .style("fill", function(d,i) {
            return vis.color(i);
        })
        .attr("d", function(d) {
            return vis.area(d);
        })
        .attr("data-key", function(d) { return d.key; });
        //.on("mouseover", hoverArea);

    /*function hoverArea() {
        d3.select(".tool-tip")
            .text(this.getAttribute("data-key"));
    }*/

	categories.exit().remove();


	// Call axis functions with the new domain 
	vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
}
