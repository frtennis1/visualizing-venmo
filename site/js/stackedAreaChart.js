

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
    this.data = _data;
    this.prefilteredData = this.data;
    this.filteredData = this.data;
    this.displayData = []; // see data wrangling

    this.timeScale = "yearly";
    this.userId = null;
    this.memokeyword = "";

    this.labelsAdded = false;

    this.initVis();
}


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

	// Overlay with path clipping
    vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0, vis.width])
        .domain([1,53]);

    vis.timeX = d3.scaleTime()
        .range([0, vis.width]);

    vis.color = d3.scaleOrdinal()
        .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");
        /*.append("text")
        .text("Number of Transactions")
        .attr("transform", "rotate(90,0,0) translate(108,-3)")
        .attr("fill", "black");*/

    vis.area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            if (vis.timeScale == 'allTime') {
                var time = d3.timeParse("%Y/%m")(d.data.week);
                return vis.timeX(time);
            } else {
                return vis.x(d.data.week);
            }
        })
        .y0(d => vis.y(d[0]))
        .y1(d => vis.y(d[1]));

    vis.wrangleData();
}



/*
 * Data wrangling
 */

StackedAreaChart.prototype.wrangleData = function(){
	var vis = this;

	// Constants
    var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var categories = ["Food", "Drinks", "Drugs", "Transportation", "Sex", "Other", "Events"];

    // Filter by user
    if (vis.userId) {
        vis.filteredData = vis.data.filter(d => d.from == vis.userId || d.to == vis.userId);
    } else {
        vis.filteredData = vis.data;
    }

    // Filter by keyword
    if (vis.memokeyword == "") {
        vis.filteredData = vis.filteredData;
    } else {
        vis.filteredData = vis.filteredData.filter(d => d.message.toLowerCase().includes(vis.memokeyword.toLowerCase()));
    }

    // Choose weekly or yearly
    var timeKey;
    var domainLength;
    if (vis.timeScale == "yearly") {
        timeKey = d => +d3.timeFormat("%U")(d.created_time);
        domainLength = 54;
    }
    else if (vis.timeScale == "weekly") {
        timeKey = d => +d3.timeFormat("%w")(d.created_time);
        domainLength = 7;
    }
    else if (vis.timeScale == "byMonth") {
        timeKey = d => +d3.timeFormat("%m")(d.created_time);
        domainLength = 12;
    }
    else if (vis.timeScale == "allTime") {
        timeKey = d => (d3.timeFormat("%Y/%m")(d.created_time));
        domainLength = null;
    }

    // Nest the data by week and category
	vis.nestedData = d3.nest()
	    .key(timeKey)
        .sortKeys(d3.ascending)
	    .key(d => d.category)
	    .rollup(d => d.length)
	    .entries(vis.filteredData);

    vis.flatData = []; //new Array(domainLength);
    vis.nestedData.forEach(function (d) {
        var row = {};
        row.week = +d.key;
        if (isNaN(row.week)) {
            row.week = d.key;
        }
        for (var i = 0; i < d.values.length; i++) {
            row[d.values[i].key] = d.values[i].value;
        }
        // Fill out 0 categories
        for (var i = 0; i < categories.length; i++) {
            if (!(categories[i] in row)) {
                row[categories[i]] = 0;
            }
        }
        //vis.flatData[d.key]
        if (vis.timeScale == 'allTime') {
            vis.flatData.push(row);
        } else {
            vis.flatData[d.key] = row;
        }
    });

    // Fill all gaps of the data
    if (vis.timeScale != 'allTime') {
        for (var i = 0; i < domainLength; i++) {
            if (typeof vis.flatData[i] != 'undefined') {
                continue;
            }
            var entry = {week: i};
            for (var j = 0; j < categories.length; j++) {
                entry[categories[j]] = 0;
            }
            vis.flatData[i] = entry;
        }
    } else {
        var firstMonth = d3.timeParse("%Y/%m")(d3.min(vis.flatData, d => d.week));
        var lastMonth = d3.timeParse("%Y/%m")(d3.max(vis.flatData, d => d.week));
        var presentMonths = vis.flatData.map(d => d.week);
        for (var i = firstMonth; i < lastMonth; i.setDate(i.getDate() + 1)) {
            if (i.getDate() != 1) {
                continue;
            }
            var monthString = d3.timeFormat("%Y/%m")(i);
            if (!(presentMonths.includes(monthString))) {
                var filler = {
                    week: monthString,
                    Food: 0,
                    Other: 0,
                    Sex: 0,
                    Drugs: 0,
                    Transportation: 0,
                    Events: 0,
                    Drinks: 0,
                };
                vis.flatData.push(filler);
            }
        }
        vis.flatData.sort((a, b) => d3.timeParse("%Y/%m")(a.week) - d3.timeParse("%Y/%m")(b.week));
    }

    // Stack the data
    vis.displayData = d3.stack()
        .keys(categories)
        (vis.flatData);

    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

StackedAreaChart.prototype.updateVis = function(){
	var vis = this;

	// Change x axis scale
    if (vis.timeScale == 'allTime') {
        vis.xAxis = d3.axisBottom().scale(vis.timeX)
    } else {
        vis.xAxis = d3.axisBottom().scale(vis.x)
    }

	// Update the y axis
    var maxY = d3.max(vis.displayData, d => d3.max(d, f => f[1]));
    vis.y.domain([0, maxY]);

    // Update the x axis
    if (vis.timeScale == 'yearly') {
        vis.x.domain([0,53]);
        vis.xAxis.ticks(4)
            .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%U")(d)));
        vis.area.curve(d3.curveMonotoneX);
    } else if (vis.timeScale == 'weekly') {
        var dayOfWeek = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
        vis.x.domain([0,7]);
        vis.xAxis.ticks(7)
            .tickFormat(d => dayOfWeek[d % 7]);
        vis.area.curve(d3.curveStepAfter);
        // Add a transactionless 8th day to let the curve render the 7th day correctly
        for (var i = 0; i < vis.displayData.length; i++) {
            var filler = [0,0];
            filler.data = { week: 7 };
            vis.displayData[i].push(filler);
        }
    }
    else if (vis.timeScale == 'byMonth') {
        vis.x.domain([1,13]);
        vis.xAxis.ticks(12)
            .tickFormat(d => d3.timeFormat("%b")(d3.timeParse("%m")(d)));
        vis.area.curve(d3.curveStepAfter);
        // Add a transactionless 13th day to let the curve render the 7th day correctly
        for (var i = 0; i < vis.displayData.length; i++) {
            var filler = [0,0];
            filler.data = { week: 13 };
            vis.displayData[i].push(filler);
        }
    }
    else if (vis.timeScale == 'allTime') {
        vis.timeX.domain(d3.extent(vis.displayData[0], d => d3.timeParse("%Y/%m")(d.data.week)));
        vis.xAxis.ticks(5)
            .tickFormat(d3.timeFormat("%b '%y"));
        vis.area.curve(d3.curveMonotoneX);
    }

    // Draw the layers
    var categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .merge(categories)
        .transition().duration(400)
        .attr("opacity", 0)
        .transition().duration(0)
        .style("fill", function(d,i) {
            return categoriesColorScale(d.key);
        })
        .attr("d", function(d) {
            return vis.area(d);
        })
        .attr("data-key", function(d) { return d.key; })
        .transition().duration(400)
        .attr("opacity", 1);

    function mouseOver() {
        legend.highlight(this.getAttribute("data-key"));
        vis.svg.selectAll(".area").attr("opacity", 0.5);
        d3.select(this).attr("opacity", 1);
    }
    function mouseOut() {
        legend.dehighlight();
        vis.svg.selectAll(".area").attr("opacity", 1);
    }

	categories.exit().remove();

    if (!vis.labelsAdded) {
        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .append("text")
            .text("Number of Transactions")
            .attr("transform", "rotate(90,0,0) translate(2,-5)")
            .attr("fill", "black")
            .style("font-size", "12px");

        vis.labelsAdded = true;
    }

	// Call axis functions with the new domain
	var xAxis = vis.svg.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
    if (vis.timeScale == "weekly") {
        var barWidth = vis.x(2) - vis.x(1);
        xAxis.attr("transform", "translate("+ barWidth/2 +",0)")
            .attr("text-anchor", "center")
    } else {
        xAxis.attr("transform", "rotate(-45) translate(-7,-5)")
            .attr("text-anchor", "end")
    }
    vis.svg.select(".y-axis").transition().duration(800).call(vis.yAxis);
}

StackedAreaChart.prototype.display = function(timeScale) {
    var vis = this;
    if (vis.timeScale == timeScale) {
        return;
    }
    vis.timeScale = timeScale;
    vis.wrangleData();
}

StackedAreaChart.prototype.filterForUser = function(userId) {
    var vis = this;
    vis.userId = userId;
    vis.wrangleData();
}

StackedAreaChart.prototype.filterKeyword = function() {
    var vis = this;
    vis.memokeyword = d3.select("#keywordInput").node().value;
    vis.wrangleData();
}

StackedAreaChart.prototype.keyword = function(keyword, timeScale) {
    var vis = this;
    vis.timeScale = "";
    d3.select("#keywordInput").node().setAttribute("value", keyword);
    vis.memokeyword = keyword;

    var analysis = {
        "christmas": "<p>Christmas transactions spike in December when users are buying gifts for friends and family.</p>",
        "apple": "<p>Apple spikes in October when friends tend to go apple picking.</p>",
        "super bowl": "<p>Super Bowl transactions spike in February around when the game is played.</p>",
        "🍦": "<p>Users tend to pay each other for ice cream more often in the hot summer than in the cold winter.</p>",
        "church": "<p>Church transactions spike right after users go to church on Sunday.</p>",
        "monday": '<p>Users mention "Monday" the most early in the week.</p>',
        "party": "<p>Party transactions spike on the weekends after users go out with their friends.</p>",
        "drinks": "<p>Drink transactions spike on the weekends after users go out with their friends.</p>",
        "yeet": '<p>"Yeet" is a new slang word whose popularity can be seen to rise in late 2017.</p>',
        "star wars": "<p>Stars Wars sees a big spike around December 2017 when The Last Jedi came out.</p>",
        "formal": '<p>"Formal" has seen increasingly dramatic spikes every May and December in the past few years, when houses host their Spring and Winter formals.</p>'
    };

    d3.select("#trendAnalysis")
        .transition().duration(400)
        .style("opacity", 0)
        .on("end", function() {
            d3.select("#trendAnalysis")
                .html(analysis[keyword])
                .transition().duration(400)
                .style("opacity", 1);
        });

    vis.display(timeScale);
}