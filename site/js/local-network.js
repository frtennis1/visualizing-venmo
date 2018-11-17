class LocalNetwork {

  constructor(_data, _params){
    this.data = _data;
    this.params = _params;

    this.initChart();
  }

  wrangleData() {
    // vis.graph needs to have all the data
    // links -> the edges
    // nodes -> the nodes
    
    var params = this.params;
    var data = this.data;
    
    var nodes = data.getUserNeighborhood(params.user, params.radius);
    
    this.graph = {links: data.getRelevantEdges(nodes), nodes: nodes}
    
    this.updateVis();
  }

  initChart() {
    var vis = this;
    var params = this.params;
    var margin = params.margin;

    vis.svg = d3.select("#" + params.divName)
        .append("svg")
        .attr("width", params.width + margin.left + margin.right)
        .attr("height", params.height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    vis.color = d3.scaleOrdinal(d3.schemeCategory20);

    vis.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.Id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(params.width / 2, params.height / 2));

    d3.select("#transactions-table")
      .style("height", 600 + "px")
      .style("overflow-y", "scroll")
      .style("display", 'block');



    vis.tip = d3.select(".g-tip");
    vis.wrangleData();
  }

  updateVis() {
    var vis = this;
    var params = this.params;

    d3.select("#local-graph-name")
      .text(data.userMap[params.user].name);

    vis.link = vis.svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(vis.graph.links);

    vis.link = vis.link
      .enter()
      .append("line")
      .merge(vis.link)
      .attr("stroke-width", d => Math.sqrt(d.num_transactions))
      .on("click", edgeclick)
      .on("mouseover", edgemouseover)
      .on("mouseout", edgemouseout);

    vis.link.exit().remove();

    vis.node = vis.svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(vis.graph.nodes);

    vis.node = vis.node
      .enter()
      .append("circle")
      .merge(vis.node)
      .attr("fill", d => vis.color(d.group))
      .attr("id", d => d.id)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .on("click", click)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    vis.node.exit().remove();

    vis.simulation
      .nodes(vis.graph.nodes)
      .on("tick", ticked);

    vis.simulation.force("link")
      .links(vis.graph.links)
      .strength(d => Math.max(0.01 *  (1 + d.num_transactions), .1) ); 
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
            var fmt = d3.timeFormat("%b '%y");
            return fmt(d.date_created);
          case "num-transactions":
            return d.num_transactions;
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
    }

    function edgeclick(d) {

      console.log(d);

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

      var fmt = d3.timeFormat("%b %d, %Y")
      rows
          .append("td")
          .text(d => fmt(d.created_time));

      rows.append("td")
          .text(function (d) {return d.message });

      transactions.exit().remove();

    }

    function edgemouseout(d) {
      d3.select(this).style("stroke-opacity", null);
    }

    function dragstarted(d) {
      if (!d3.event.active) vis.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) vis.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }
}

