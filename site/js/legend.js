

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

Legend = function(_parentElement){
    this.parentElement = _parentElement;
    this.data = ["Other", "Food", "Sex", "Events", "Transportation", "Drinks", "Drugs"];

    this.initVis();
}

Legend.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 0, bottom: 20, left: 180 };

    vis.width = 500;
    vis.height = 500;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Legend
    vis.legend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(90,150)");

    // Legend squares
    vis.cells = vis.legend.selectAll(".cell")
        .data(vis.data);

    // Legend labels
    vis.legendLabels = vis.legend.selectAll(".label")
        .data(vis.data);

    // Legend
    var boxSize = 20;
    var boxPadding = 10;

    /*const categoriesColorScale = d3.scaleOrdinal()
        .domain(["Other", "Food", "Sex", "Events", "Transportation", "Drinks", "Drugs"])
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);*/
    vis.color = categoriesColorScale;

    // Squares to show category colors
    vis.cells.enter().append("rect")
        .attr("width", boxSize).attr("height", boxSize)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) })
        .attr("fill", function(d, i) { return vis.color(i); });

    // Labels for colored squares
    vis.legendLabels.enter().append("text")
        .style("text-anchor", "end")
        .style("alignment-baseline", "middle")
        .style("font-size", 13)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) + boxSize/2 })
        .attr("x", -boxPadding)
        .text(function(d, i) { return d });

}