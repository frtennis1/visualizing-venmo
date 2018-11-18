

/*
 * PieChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

PieChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.nestedData = this.data;
    this.filteredData = this.data;

    this.initVis();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

PieChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 150 };

    //vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    //    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.width = 500;
    vis.height = 500;

    var radius = 220;
    var thickness = 100;

    // Nest the data
    vis.nested_data = d3.nest()
        .key(function(d) { return d.category })
        .rollup(function (v) { return v.length })
        .entries(vis.data);

    console.log(vis.nested_data);

    var percentFormatter = function(p) {
        return d3.format(".2s")(100 * p) + "%";
    }

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    var color = d3.scaleOrdinal()
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

    var arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(radius - thickness);

    var largeArc = d3.arc()
        .outerRadius(radius + 20)
        .innerRadius(radius - thickness);

    var labelArc = d3.arc()
        .outerRadius(radius - 30)
        .innerRadius(radius - 30);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.value; })
        .padAngle(0.01);

    var g = vis.svg.selectAll(".arc")
        .data(pie(vis.nested_data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("transform", "translate("+ vis.width/2 +","+ vis.height/2 +")")
        .attr("d", arc)
        .style("fill", function(d, i) { return color(i); })
        .on("mouseover", function(d) {
            vis.tooltips.select(".title")
                .text(d.data.key);
            vis.tooltips.select(".subtitle")
                .text(percentFormatter(d.value / vis.data.length));
            d3.select(this)
                .transition()
                .duration(500)
                .attr("d", largeArc);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .transition()
                .duration(500)
                .attr("d", arc);
        });

    // Legend
    var boxSize = 20;
    var boxPadding = 10;

    vis.legend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate("+ -25 +","+ vis.height/2 +")");

    vis.cells = vis.legend.selectAll(".cell")
        .data(vis.nested_data);

    vis.cells.enter().append("rect")
        .attr("width", boxSize).attr("height", boxSize)
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) - (boxSize + boxPadding) * vis.nested_data.length / 2 })
        .attr("fill", function(d, i) { return color(i); });

    vis.legendLabels = vis.legend.selectAll(".label")
        .data(vis.nested_data);

    vis.legendLabels.enter().append("text")
        .style("text-anchor", "end")
        .style("alignment-baseline", "middle")
        .attr("y", function(d, i) { return i * (boxSize + boxPadding) + (boxSize/2) - (boxSize + boxPadding) * vis.nested_data.length / 2 })
        .attr("x", -boxPadding)
        .text(function(d, i) { return d.key });

    // Tool tips
    vis.tooltips = vis.svg.append("g")
        .attr("class", "tool-tip");

    vis.tooltips.append("text")
        .attr("class", "title")
        .attr("transform", "translate("+vis.width/2+","+(vis.height/2-20)+")")
        .text("title")
        .style("text-anchor", "middle")
        .style("font-size", 15);

    vis.tooltips.append("text")
        .attr("class", "subtitle")
        .attr("transform", "translate("+vis.width/2+","+(vis.height/2-10)+")")
        .text("subtitle")
        .attr("textLength", 100)
        .attr("lengthAdjust", "spacingAndGlyphs")
        .style("font-size", 60)
        .style("text-anchor", "middle")
        .style("alignment-baseline", "hanging");

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
