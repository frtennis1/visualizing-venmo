
/*
 * PieChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the actual data
 */

PieChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;

    console.log(this);

    this.initVis();
};


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

PieChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);

    vis.pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

    vis.arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(vis.pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
        .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
        .attr("class", "slice");    //allow us to style things in the slices (like text)

    vis.arcs.append("svg:path")
        .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
        .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function

    vis.arcs.append("svg:text")                                     //add a label to each slice
        .attr("transform", function(d) {                    //set the label's origin to the center of the arc
            //we have to make sure to set these before calling arc.centroid
            d.innerRadius = 0;
            d.outerRadius = r;
            return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
        })
        .attr("text-anchor", "middle")                          //center the text on it's origin
        .text(function(d, i) { return data[i].category; });        //get the label from our original data array


    vis.wrangleData();
};



/*
 * Data wrangling
 */

PieChart.prototype.wrangleData = function(){
    var vis = this;

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function
 */

PieChart.prototype.updateVis = function(){
    var vis = this;
};
