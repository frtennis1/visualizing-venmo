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

    var groups = jLouvain()
      .nodes(nodes.map(n => n.Id))
      .edges(this.graph.links)();

    this.graph.nodes.forEach(d => {
      d.group = groups[d.Id];
    });
    
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

    vis.color = d3.scaleOrdinal(d3.schemeCategory10);

    vis.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.Id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(params.width / 2, params.height / 2));

    d3.select("#transactions-table")
      .style("height", 600 + "px")
      .style("overflow-y", "scroll")
      .style("display", 'block');

    vis.svg.append("g")
      .attr("class", "links");

    vis.svg.append("g")
        .attr("class", "nodes");

    vis.tip = d3.tip()
      .attr("class", "g-tip")
      .html(d => vis.userContent(d));

    vis.svg.call(vis.tip);

    vis.wrangleData();
  }

  userContent(d) {
    
    var fmt = d3.timeFormat("%b '%y");

    return `<div class="g-tip-shadow"></div>
       <svg class="g-tip-box" width="150" height="87">
         <path transform="translate(75,91)" d="M0.5,-6.5l5,-5H74.5v-79H-74.5v79H-5Z"/>
       </svg>
       <div class="g-tip-content">
         <div class="g-tip-title">${d.name}</div>
         <div class="g-tip-subtitle">(${d.username})</div>
         <div class="g-tip-metric" data-name="created-at">
             <span class="g-tip-metric-name">Created</span>
             <span class="g-tip-metric-value">${fmt(d.date_created)}</span>
         </div>
         <div class="g-tip-metric" data-name="num-transactions">
             <span class="g-tip-metric-name">Transactions</span>
             <span class="g-tip-metric-value">${d.num_transactions}</span>
         </div>
       </div>`;
  }

  updateVis() {
    var vis = this;
    var params = this.params;

    d3.select("#local-graph-name")
      .text(data.userMap.get(params.user).name);

    vis.link = vis.svg.select(".links")
      .selectAll("line")
      .data(vis.graph.links, d => d.Id);

    vis.link.exit().remove();

    vis.link = vis.link
      .enter()
      .append("line")
      .merge(vis.link)
      .attr("stroke-width", d => Math.sqrt(d.num_transactions))
      .on("click", edgeclick);

    vis.node = vis.svg.select(".nodes")
      .selectAll("circle")
      .data(vis.graph.nodes, d => d.Id);

    vis.node.exit().remove();

    vis.node = vis.node
      .enter()
      .append("circle")
      .merge(vis.node)
      .attr("fill", d => vis.color(d.group))
      .attr("id", d => d.id)
      .on("mouseover", vis.tip.show)
      .on("mouseout", vis.tip.hide)
      .on("click", click)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    vis.simulation
      .nodes(vis.graph.nodes)
      .on("tick", ticked);

    vis.simulation.force("link")
      .links(vis.graph.links)
      .strength(d => Math.max(0.01 *  (1 + d.num_transactions), .1) ); 
    // TODO: fix magic strength function
    
    /* simulation.force("radial", d3.forceRadial(200, width/2, height/2)
        .strength(function(d) { return (d.group == 2) ? 0.5 : 0})); */

    vis.simulation.restart();

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

    // node functions

    function click(d) {
      vis.params.changeUserCallback(d.Id);
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

  updateUser(userId) {
    var vis = this;

    vis.params.user = userId;
    vis.wrangleData();

    vis.simulation.restart().alpha(1);
  }
}

