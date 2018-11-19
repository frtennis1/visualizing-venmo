

/*
 * WordCloud - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

WordCloud = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.initVis();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

WordCloud.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 150 };

    vis.width = 500;
    vis.height = 500;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.wrangleData();
}



/*
 * Data wrangling
 */

WordCloud.prototype.wrangleData = function(){
    var vis = this;
    console.log(vis.data);

    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function
 */

WordCloud.prototype.updateVis = function(){
    var vis = this;

    // var fill = d3.scale.category20();

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(vis.data, function(d) {
            return d.value;
        })
        ])
        .range([10,100]);

    var layout = d3.layout.cloud().size([vis.width, vis.height])
        .words(d3.entries(vis.data))
        .fontSize(function(d) { return xScale(+d.value) })
        .text(function(d) {return d.key; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .on("end", draw);

    layout.start();

    function draw(words) {
        vis.svg
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) { return xScale(d.value) + "px"; })
            .style("fill", function(d, i) {
                // return fill(i);
                return "blue";
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.key; });
    }

    d3.layout.cloud().stop();

}
