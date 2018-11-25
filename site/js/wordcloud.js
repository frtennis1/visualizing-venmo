

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

    vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };

    vis.width = 700;
    vis.height = 300;

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
        .domain([d3.min(vis.data, function(d) {
            return d.occurrences;
        }), d3.max(vis.data, function(d) {
            return d.occurrences;
        })
        ])
        .range([20,100]);

    var layout = d3.layout.cloud()
        .size([vis.width, vis.height])
        .words(vis.data)
        .fontSize(function(d) {
            return xScale(+d.occurrences) })
        .text(function(d) {return d.word; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .on("end", draw);

    layout.start();

    function draw(words) {
        vis.svg
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .attr('class', 'word-cloud-word')
            .style("font-size", function(d) {
                return xScale(+d.occurrences) + "px"; })
            .style("fill", function(d) {
                return categoriesColorScale(d.category);
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x + vis.width/2, d.y + vis.height/2] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.word; });
    }

    d3.layout.cloud().stop();

}
