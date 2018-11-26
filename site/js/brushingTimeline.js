
/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

BrushingTimeline = function(_parentElement, _data, _initialUserId, _callback, _class){

    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;
    this.initialUserId = _initialUserId;
    this.callback =  _callback;
    this.class =  _class;

    this.initVis();
}


/*
 * Initialize area chart with brushing component
 */

BrushingTimeline.prototype.initVis = function(){
	var vis = this; // read about the this

	vis.margin = {top: 50, right: 0, bottom: 50, left: 30};

	vis.width = 1000 - vis.margin.left - vis.margin.right,
  	vis.height = 45;

  // SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.filteredData = vis.data.filter(d => d.from == vis.initialUserId || d.to == vis.initialUserId);


	// Scales and axes
  vis.x = d3.scaleTime()
	  	.range([0, vis.width])
	  	.domain(d3.extent(vis.filteredData, function(d) { return d.created_time; }));

	vis.xAxis = d3.axisBottom()
		  .scale(vis.x);


	// SVG area path generator
	vis.area = d3.area()
			.x(function(d) { return vis.x(d.created_time); })
			.y0(vis.height)
			.y1(0);

	// Draw area by using the path generator
	vis.svg.append("path")
      .datum(vis.filteredData)
      .attr("fill", "#30baff")
      .attr("d", vis.area);


  // Initialize brush component
    vis.brush = d3.brushX()
        .extent([[0, 0], [vis.width, vis.height]])
        .on("brush", vis.callback);

  // Append brush component here
  vis.svg.append("g")
      .attr("class", "x " + vis.class)
      .call(vis.brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", vis.height + 7);

  // Append x-axis
  vis.svg.append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0," + vis.height + ")")
      .call(vis.xAxis);

  vis.svg.append("text")
	  .attr("x", vis.width/2)
	  .attr("y", 2*vis.height)
	  .attr("text-anchor", "middle")
	  .attr("class", "tool-tip");
}

BrushingTimeline.prototype.updateVis = function() {
    var vis = this;
    vis.x.domain(d3.extent(vis.filteredData, function(d) { return d.created_time; }));
    vis.xAxis = d3.axisBottom()
        .scale(vis.x);
    vis.svg.select(".x-axis").call(vis.xAxis);
}


BrushingTimeline.prototype.filterForUser = function(userId) {
    var vis = this;

    vis.filteredData = vis.data.filter(d => d.from == userId || d.to == userId);

	vis.updateVis();
}

BrushingTimeline.prototype.updateTimerangeText = function(timerange) {
    var vis = this;

    vis.svg.select(".tool-tip")
        .text("Selected Range: " + d3.timeFormat("%b %d, %Y")(timerange[0]) + " - " + d3.timeFormat("%b %d, %Y")(timerange[1]));
}
