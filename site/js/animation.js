
function createAnimation() {

    var width = 279/1.8;
    var height = 565/1.8;

    var rounding = 10;

    var svg = d3.select("#svg-animation").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("margin-top", 120)
        .style("margin-left", 100);

    var phone = svg.append("rect")
        .attr("height", height)
        .attr("width", width)
        .attr("fill", "black")
        .attr("rx", rounding + 5)
        .attr("rx", rounding + 5);

    var margin = {
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
    };

    var screen = svg.append("rect")
        .attr("x", margin.left)
        .attr("width", width - margin.left - margin.right)
        .attr("y", margin.top)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "white")
        .attr("rx", rounding)
        .attr("ry", rounding);

    var bumper = svg.append("rect")
        .attr("x", margin.left * 4)
        .attr("height", 15)
        .attr("width", width - margin.left * 8)
        .attr("y", 0)
        .attr("rx", rounding)
        .attr("ry", rounding);

    var bumper = svg.append("rect")
        .attr("x", margin.left * 4)
        .attr("height", 15/2)
        .attr("width", width - margin.left * 8)
        .attr("y", 0);

    /*var home = svg.append("circle")
        .attr("cx", width/2)
        .attr("cy", height - margin.bottom/2)
        .attr("r", 10)
        .attr("fill", "gray");*/
}

createAnimation();