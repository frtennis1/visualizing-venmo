class BeeSwarm {
  constructor(_data, _transactions, _params) {
    this.data = _data;
    this.transactions = _transactions;
    this.params = _params;

    this.initVis();
  }

  initVis() {
    var vis = this;
    var params = vis.params;
    var margin = params.margin;

    vis.svg = d3.select('#' + params.parentDiv)
      .append("svg")
      .attr("width", params.width + margin.left + margin.right)
      .attr("height", params.height + params.margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    vis.x = d3.scaleTime()
      .range([0, params.width]);

    vis.xAxis = d3.axisBottom()
      .scale(vis.x);
    
    vis.svg.append("g")
      .attr("transform", `translate(0,${params.height})`)
      .attr("class", "axis x-axis")
      .call(vis.xAxis);

    vis.tip = d3.tip()
      .attr("class", "g-tip")
      .style('pointer-events', 'none')
      .html(d => vis.transactionContent(d));

    vis.svg.call(vis.tip);

    vis.updateVis();

  }

  transactionContent(d) {
    var fromUser = this.data.userMap[d.from];
    var toUser = this.data.userMap[d.to];
    var transactionVerb;

    if (d.type == "charge") 
      transactionVerb = "charged";
    else
      transactionVerb = "paid";

    var dateFmt = d3.timeFormat("%b %-d, '%y, %-I:%M%p");
      
    return `<div class="g-tip-shadow"></div>
       <svg class="g-tip-box" width="150" height="87">
         <path transform="translate(75,91)" d="M0.5,-6.5l5,-5H74.5v-79H-74.5v79H-5Z"/>
       </svg>
       <div class="g-tip-content">
         <div class="g-tip-title"> ${dateFmt(d.created_time)}</div>
         <div class="g-tip-subtitle">${d.message}</div>
         <div class="g-tip-metric" data-name="created-at">
             <span class="g-tip-metric-name">From</span>
             <span class="g-tip-metric-value">${fromUser.name}</span>
         </div>
         <div class="g-tip-metric" data-name="num-transactions">
             <span class="g-tip-metric-name">To</span>
             <span class="g-tip-metric-value">${toUser.name}</span>
         </div>
       </div>`;
  }

  updateData(newTransactions) {
    this.transactions = newTransactions;
    this.updateVis();
  }

  updateVis() {
    var vis = this;
    var params = this.params;

    vis.x.domain(d3.extent(vis.transactions, d => d.created_time));

    vis.sim = d3.forceSimulation(vis.transactions)
      .force("x", d3.forceX(d => vis.x(d.created_time)).strength(1))
      .force("y", d3.forceY(params.height / 2))
      .force("collide", d3.forceCollide(6))
      .stop();

    d3.range(100).forEach(d => {vis.sim.tick() });

    vis.points = vis.svg.selectAll("circle")
      .data(vis.transactions, d => d.Id);

    vis.points.enter()
      .append("circle")
      .attr("class", "beeswarm-circle")
      .merge(vis.points)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .on('mouseover', vis.tip.show)
      .on('mouseout', vis.tip.hide);

    vis.points.exit().remove();

    vis.svg.select(".x-axis").call(vis.xAxis);

  }
}
