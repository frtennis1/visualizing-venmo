
var percentFormatter = function(p) {
    return d3.format(".2s")(100 * p) + "%";
}

/*
 * PieChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

PieChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;
    this.nestedData = this.data;

    this.initVis();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

PieChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 130 };

    //vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    //    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.width = 500;
    vis.height = 500;

    var radius = 200;
    var thickness = 100;

    // Nest the data
    vis.nested_data = d3.nest()
        .key(function(d) { return d.category })
        .rollup(function (v) { return v.length })
        .entries(vis.data);

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.color = d3.scaleOrdinal()
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

    vis.pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.value; })
        .padAngle(0.01);

    vis.arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(radius - thickness);

    vis.largeArc = d3.arc()
        .outerRadius(radius + 20)
        .innerRadius(radius - thickness);

    // Tool tips
    vis.tooltips = vis.svg.append("g")
        .attr("class", "tool-tip");
    vis.tooltips.append("text")
        .attr("class", "title")
        .attr("transform", "translate("+vis.width/2+","+(vis.height/2-25)+")")
        .style("text-anchor", "middle")
        .style("font-size", 15);
    vis.tooltips.append("text")
        .attr("class", "subtitle")
        .attr("transform", "translate("+vis.width/2+","+(vis.height/2-15)+")")
        .attr("textLength", 100)
        .attr("lengthAdjust", "spacingAndGlyphs")
        .style("font-size", 60)
        .style("text-anchor", "middle")
        .style("alignment-baseline", "hanging");

    // Legend
    vis.legend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate("+ -25 +","+ vis.height/2 +")");

    // Legend squares
    vis.cells = vis.legend.selectAll(".cell")
        .data(vis.nested_data);

    // Legend labels
    vis.legendLabels = vis.legend.selectAll(".label")
        .data(vis.nested_data);

    // Legend
    var boxSize = 20;
    var boxPadding = 10;

    // Squares to show category colors
    vis.cells.enter().append("rect")
        .attr("width", boxSize).attr("height", boxSize)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) - (boxSize + boxPadding) * vis.nested_data.length / 2 })
        .attr("fill", function(d, i) { return vis.color(i); })
        .merge(vis.cells)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) - (boxSize + boxPadding) * vis.nested_data.length / 2 });
    vis.cells.exit().remove();

    // Labels for colored squares
    vis.legendLabels.enter().append("text")
        .style("text-anchor", "end")
        .style("alignment-baseline", "middle")
        .style("font-size", 13)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) + (boxSize/2) - (boxSize + boxPadding) * vis.nested_data.length / 2 })
        .attr("x", -boxPadding)
        .text(function(d, i) { return d.key })
        .merge(vis.legendLabels)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) + (boxSize/2) - (boxSize + boxPadding) * vis.nested_data.length / 2 });
    vis.legendLabels.exit().remove();

    vis.wrangleData();
}



/*
 * Data wrangling
 */

PieChart.prototype.wrangleData = function(){
    var vis = this;

    vis.nested_data = d3.nest()
        .key(function(d) { return d.category })
        .rollup(function (v) { return v.length })
        .entries(vis.filteredData);

    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function
 */

PieChart.prototype.updateVis = function(){
    var vis = this;

    // Draw the arcs
    vis.arcs = vis.svg.selectAll(".arc")
        .data(vis.pie(vis.nested_data), d => d.key);

    vis.arcs.enter().append("path")
        .attr("class", "arc")
        .attr("transform", "translate("+ vis.width/2 +","+ vis.height/2 +")")
        .attr("d", vis.arc)
        .style("fill", function(d, i) { return vis.color(i); })
        .on("mouseover", function(d) {
            vis.tooltips.select(".title")
                .text(d.data.key);
            vis.tooltips.select(".subtitle")
                .text(percentFormatter(d.value / vis.filteredData.length));
            d3.select(this)
                .transition()
                .duration(500)
                .attr("d", vis.largeArc);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .transition()
                .duration(500)
                .attr("d", vis.arc);
        })
        .merge(vis.arcs)
        .attr("d", vis.arc);
    vis.arcs.exit().remove();

}



/*
    Function for filtering for a certain user
 */

PieChart.prototype.filterForUser = function(userId) {
    var vis = this;

    vis.filteredData = vis.data.filter(d => d.from == userId || d.to == userId);

    vis.svg.selectAll(".tool-tip .title").text("");
    vis.svg.selectAll(".tool-tip .subtitle").text("");

    vis.wrangleData();
}