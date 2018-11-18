
/*
 * PieChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

PieChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

PieChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

    //vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    //    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.width = 500;
    vis.height = 500;

    var radius = d3.min([vis.width/2, vis.height/2]);

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

    var color = d3.scaleOrdinal()
        .range(["red", "blue", "green", "yellow", "orange", "purple", "white", "black"]);

    var arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.value; });

    var g = vis.svg.selectAll(".arc")
        .data(pie(vis.data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d, i) { return color(i); });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d, i) { return vis.data[i]['category']; });


    vis.wrangleData();
}



/*
 * Data wrangling
 */

PieChart.prototype.wrangleData = function(){
    var vis = this;

    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function
 */

PieChart.prototype.updateVis = function(){
    var vis = this;
}
