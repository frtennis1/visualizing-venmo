
var users, transactions;

var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

$(document).ready(() => {
});

function loadNameSelector() {
  var names = {}
  users.forEach(d => {
    if (d.is_crawled)
      names[d.name + " (" + d.username + ")"] = d.Id;
  });

  $('input.autocomplete').autocomplete({
    data: names,
    limit: 5
  });

}

d3.queue()
  .defer(d3.csv, "data/users.csv")
  .defer(d3.csv, "data/transactions.csv")
  .defer(d3.csv, "data/transactionBreakdown.csv")
  .await((err, _users, _transactions, _breakdown) => {
    _transactions.forEach(d => {
      d.from = +d.from;
      d.to = +d.to;
      d.payment_id = +d.payment_id;
      d.created_time = parseTime(d.created_time);
      d.updated_time = parseTime(d.updated_time);
    });

    _users.forEach(d => {
      d.Id = +d.Id;
      d.date_created = parseTime(d.date_created);
      d.external_id = +d.external_id;
      d.cancelled = Boolean(d.cancelled);
      d.is_business = Boolean(d.is_business);
      d.is_crawled = Boolean(d.is_crawled);
    });

    users = _users;
    transactions = _transactions;

    var piechart = PieChart("transactionBreakdown", _breakdown);

    loadNameSelector();
  });

// summer code below

var svg = d3.select("svg");
    /* .attr("width", window.width)
    .attr("height", window.height); */

var width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));



d3.json("graph.json", function(error, graph) {
  if (error) throw error;

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  link
      .on("click", edgeclick)
      .on("mouseover", edgemouseover)
      .on("mouseout", edgemouseout);

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", function(d) { return d.size; })
      .attr("fill", function(d) { return color(d.group); })
      .attr("id", function(d) { return d.id})
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  node
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .on("click", click);

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links)
      .strength(function (d) {return Math.max(0.01 *  (1 + d.value), .1) }); 

  
  /* simulation.force("radial", d3.forceRadial(200, width/2, height/2)
      .strength(function(d) { return (d.group == 2) ? 0.5 : 0})); */

  var tip = d3.select(".g-tip");

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
});

function mouseover(d) {
  d3.select(this).style("stroke", "#000000")
      .style("stroke-opacity", .3);

  var tip = d3.select(".g-tip")
      .style("display", null)
      .style("left", (d.x - 65 ) + "px")
      .style("top", (d.y - d.size + 5) + "px")
      .classed("persisted", false);

  tip.select(".g-tip-title")
      .text(d.name)

  tip.select(".g-tip-subtitle")
      .text("(" + d.username + ")")
      .style("font-weight", null);

  var tipMetric = tip.selectAll(".g-tip-metric")
      .datum(function() {
          return this.getAttribute("data-name");
      });

  tipMetric.select(".g-tip-metric-value").text(function(name) {
    switch (name) {
      case "created-at":
        return d.created_at
      case "num-transactions":
        return d.num_from + d.num_to
    }
  });

}

function click(d) {
  d3.select(this).style("stroke-opacity", 1);
  d3.select(".g-tip").classed("persisted", true);

  // TODO: need to call the json file that reads in the new data
  d3.json(d.id + ".json", function(error, graph) {
    if (error) throw error;

    simulation
      .force("center", null);

    /* d3.forceCenter(width / 2, height / 2) */

    var prevLinkData = d3.local();
    var prevNodeData = d3.local();

    d3.select(".links")
      .selectAll("line")
      .each(function(d) {prevLinkData.set(this, d) });

    d3.select(".nodes")
      .selectAll("circle")
      .each(function (d) {prevNodeData.set(this, d) });

    var link = d3.select(".links")
      .selectAll("line")
      .data(graph.links, function(d) {return d.id} );

    link.each(function(d) {
      var prevData = prevLinkData.get(this);
      d.source.x = prevData.source.x;
      d.source.y = prevData.source.y;
      d.target.x = prevData.target.x;
      d.target.y = prevData.target.x; });

    link.exit().remove();

    link = link
      .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .on("click", edgeclick)
        .on("mouseover", edgemouseover)
        .on("mouseout", edgemouseout)
      .merge(link);


    var node = d3.select(".nodes")
      .selectAll("circle")
      .data(graph.nodes, function(d) { return d.id });

    node.each(function(d) {
      var prevData = prevNodeData.get(this);
      d.x = prevData.x;
      d.y = prevData.y; });

    node
      .exit()
      .transition()
      .delay(function(d,i) { return 10*i })
      .remove();

    node = node
      .enter()
      .append("circle")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
      .merge(node)
        .attr("r", function(d) { return d.size; })
        .attr("fill", function(d) { return color(d.group); })
        .attr("id", function(d) { return d.id});

    node
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", click);

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links)
        .strength(function (d) {return Math.max(0.01 *  (1 + d.value), .1) }); 

    var t1 = d3.timer(function(e) {
        simulation.alphaTarget(1);
        simulation.force("center",
          d3.forceCenter(width / 2, height / 2));
        t1.stop()},
      500);


    var t2 = d3.timer(function(e) {
        simulation.alphaTarget(0);
        t2.stop()}, 
      1000);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
  });



}

function mouseout(d) {
  d3.select(this)
    .style("stroke", "#FFF")
    .style("stroke-opacity", 1);

 
  var tip = d3.select(".g-tip");
  
  if (!tip.classed("persisted"))
    tip.style("display", "none");
}

function edgemouseover(d) {
  d3.select(this).style("stroke-opacity", 1);

  /*var tip = d3.select(".g-tip")
      .style("left", (d3.event.pageX - 65) + "px")
      .style("top", (d3.event.pageY - 80) + "px")
      .classed("persisted", false);

  tip.select(".g-tip-title")
    .text(d.source.name);

  tip.select(".g-tip-subtitle")
    .text("& " + d.target.name)
    .style("font-weight", "bold");

  var tipMetric = tip.selectAll(".g-tip-metric")
      .datum(function() {
          return this.getAttribute("data-name");
      });

  tipMetric.select(".g-tip-metric-value").text(function(name) {
    switch (name) {
      case "created-at":
        return "N/A";
      case "num-transactions":
        return d.value;
    }
  }); */


}

function edgeclick(d) {

  d3.select("#transactions").selectAll("h4")
    .data([d.source, d.target])
    .text(function (d) {return d.name });

  var transactions = d3.select("#transactions")
      .select("tbody")
      .selectAll("tr")
      .data(d.transactions, function (d) { return d.id} );

  var rows = transactions
      .enter()
      .append("tr");

  rows
      .append("td")
      .text(function (d) { return d.created_time });

  rows.append("td")
      .text(function (d) {return d.caption });

  transactions.exit().remove();

}

function edgemouseout(d) {
  d3.select(this).style("stroke-opacity", null);
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


