
function findOverlap(a, b) {
    if (b.length === 0) {
        return "";
    }
    if (a.endsWith(b)) {
        return b;
    }
    if (a.indexOf(b) >= 0) {
        return b;
    }
    return findOverlap(a, b.substring(0, b.length - 1));
}

var formatDate = d3.timeFormat("%B %e, %Y");
/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

HangoutsTimeline = function(_parentElement, _data, _users){
    this.parentElement = _parentElement;
    this.data = _data;
    this.users = _users;
    this.filtered_data = _data;
    this.initVis();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

HangoutsTimeline.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

    vis.width = 600;
    vis.height = 300;

    // SVG drawing area
    vis.svgTimeline = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.x = d3.scaleTime()
        .range([0, vis.width]);

    vis.r = d3.scaleLinear()
        .range([5, 20]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.svgTimeline.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " +( vis.height - vis.margin.bottom - vis.margin.top) + ")");

    vis.svgTimeline.append("text")
        .attr("x", vis.width/2)
        .attr("y", vis.height)
        .attr("text-anchor", "middle")
        .attr("class", "x-axis-label")
        .text("Date");

    vis.svgWords = d3.select("#hangouts-details").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.wrangleData();
}



/*
 * Data wrangling
 */

HangoutsTimeline.prototype.wrangleData = function(){
    var vis = this;

    vis.filtered_data = vis.filtered_data.filter(function(hangout) {
        return hangout.length > 4;
    });


    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function
 */

HangoutsTimeline.prototype.updateVis = function(){
    var vis = this;

    vis.x.domain([d3.min(vis.filtered_data, function(d) { return d[0].created_time; }),
        d3.max(vis.filtered_data, function(d) { return d[0].created_time; })]);

    vis.r.domain([d3.min(vis.filtered_data, function(d) { return d.length; }),
        d3.max(vis.filtered_data, function(d) { return d.length; })]);

    vis.tip = d3.tip()
        .attr("class", "tooltip")
        .html(
            function(d) {
                return d[0].message;
            });
    vis.svgTimeline.call(vis.tip);

    vis.sim = d3.forceSimulation(vis.filtered_data)
        .force("x", d3.forceX(function(d) { return vis.x(d[0].created_time)}).strength(1))
        .force("y", d3.forceY(vis.height/2 - vis.margin.bottom))
        .force("collide", d3.forceCollide(6))
        .stop();

    d3.range(100).forEach(function(d) { vis.sim.tick() });

    vis.points = vis.svgTimeline.selectAll("circle")
        .data(vis.filtered_data, d => d[0].Id);

    vis.points.enter()
        .append("circle")
        .on("mouseover", vis.tip.show)
        .on("mouseout", vis.tip.hide)
        .on("click", showEvent)
        .attr("class", "hangout")
        .merge(vis.points)
        .attr("r", 5)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => categoriesColorScale(d[0].category));

    vis.points.exit().remove();


    // update axes
    vis.svgTimeline.select(".x-axis")
        .call(vis.xAxis);

}

function showEvent(d) {
    vis = this;

    var str = "<div>" + d.length +
        " people paid " + d[0].to + " on "
        + formatDate(d[0].created_time)
    + " for <ul class='list-group'>";
    d.forEach(function(trans) {
        str +=
            "<li class='list-group-item'>" + trans.message + "</li>";
    });
    str += "</ul></div>";
    d3.select("#hangouts-details").html(str);


}

HangoutsTimeline.prototype.filterForTimerange = function(timerange) {
    var vis = this;
    vis.filtered_data = vis.data.filter(d => d[0].created_time > timerange[0] && d[d.length - 1].created_time < timerange[1]);

    vis.wrangleData();
}

