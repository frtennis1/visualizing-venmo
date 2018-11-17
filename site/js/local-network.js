class LocalNetwork {

  constructor(_data, _params){
    this.data = _data;

    this.initChart();
  }

  wrangleData() {
    // vis.graph needs to have all the data
    // links -> the edges
    // nodes -> the nodes
    
    vis.updateVis();
  }

  initChart() {
    var vis = this;
    var params = this.params;
    var margin = params.margin;

    vis.svg = d3.select("#" + params.divName)
        .append("svg")
        .attr("width", vis.width + margin.left + margin.right)
        .attr("height", vis.height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top}`);

    vis.color = d3.scaleOrdinal(d3.schemeCategory20);

    vis.simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    vis.tip = d3.select(".g-tip");
    vis.wrangleData();
  }

  updateVis() {
    var vis = this;
    var params = this.params;

    vis.link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(vis.graph.links);

    vis.link
      .enter()
      .append("line")
      .merge(vis.link)
      .attr("stroke-width", d => Math.sqrt(d.value))
      .on("click", edgeclick)
      .on("mouseover", edgemouseover)
      .on("mouseout", edgemouseout);

    vis.link.exit().remove();

    vis.node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes);

    vis.node
      .enter()
      .append("circle")
      .merge(vis.node)
      .attr("r", d => d.size)
      .attr("fill", d => color(d.group))
      .attr("id", d => d.id)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .on("click", click)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    vis.node.exit().remove();

    simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(graph.links)
      .strength(d => Math.max(0.01 *  (1 + d.value), .1) ); 
    // TODO: fix magic strength function

    
    /* simulation.force("radial", d3.forceRadial(200, width/2, height/2)
        .strength(function(d) { return (d.group == 2) ? 0.5 : 0})); */


    function ticked() {
      vis.link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      vis.node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }
  }

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
}

