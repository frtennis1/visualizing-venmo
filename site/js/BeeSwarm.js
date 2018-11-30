class BeeSwarm {
  constructor(_data, _userId, _params) {
    this.data = _data;
    this.filteredData = this.data;
    this.userId = _userId;
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

    vis.y = d3.scalePoint()
      .padding(1)
      .range([0, params.height]);

    vis.xAxis = d3.axisBottom()
      .scale(vis.x);

    vis.yAxis = d3.axisLeft()
      .scale(vis.y);
    
    vis.svg.append("g")
      .attr("transform", `translate(0,${params.height})`)
      .attr("class", "axis x-axis")
      .call(vis.xAxis);

    vis.svg.append("g")
      .attr("class", "axis y-axis")
      .call(vis.yAxis);

    vis.tip = d3.tip()
      .attr("class", "g-tip")
      .style('pointer-events', 'none')
      .html(d => vis.transactionContent(d));

    vis.svg.call(vis.tip);

    vis.updateData(vis.userId);

  }

  transactionContent(d) {
    var fromUser = this.data.userMap.get(d.from);
    var toUser = this.data.userMap.get(d.to);
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
         <div class="g-tip-title">${d.message}</div>
         <div class="g-tip-subtitle"> ${dateFmt(d.created_time)}</div>
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

  updateData(userId) {
    var vis = this;

    vis.userId = userId;
    vis.transactions = vis.filteredData.getUserTransactions(userId);
    vis.transactions.forEach(d => {
      if (d.from == userId)
        d.other_person = d.to;
      else
        d.other_person = d.from;
    });

    var top5 = d3.nest()
      .key(d => d.other_person)
      .rollup(d => d.length)
      .entries(vis.transactions)
      .sort((a,b) => b.value - a.value)
      .slice(0,5)
      .map(d => +d.key);

    vis.yDomain = top5.map(d => vis.data.userMap.get(d).name);
    vis.yDomain.push("Other");

    this.transactions.forEach(d => {
      if (top5.includes(d.other_person))
        d.other_person_safe = vis.data.userMap.get(d.other_person).name;
      else
        d.other_person_safe = "Other";
    });

    vis.x.domain(d3.extent(vis.transactions, d => d.created_time));

    this.updateVis();
  }

  updateVis() {
    var vis = this;
    var params = this.params;

    //vis.x.domain(d3.extent(vis.transactions, d => d.created_time));

    vis.y.domain(vis.yDomain);

    vis.sim = d3.forceSimulation(vis.transactions)
      .force("x", d3.forceX(d => vis.x(d.created_time)).strength(1))
      .force("y", d3.forceY(d => vis.y(d.other_person_safe)))
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
      .attr("fill", d => categoriesColorScale(d.category))
      .on('mouseover', function(d) {
          legend.highlight(d.category);
          vis.tip.show;
      })
      .on('mouseout', function() {
        legend.dehighlight();
          vis.tip.hide;
      });

    vis.points.exit().remove();

    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

  }

  filterForTimerange(timerange) {
      var vis = this;

      var filteredTransactions = vis.data.transactions.filter(d => d.created_time > timerange[0] && d.created_time < timerange[1]);
      vis.filteredData = new DataWrapper(filteredTransactions, vis.data.users);

      vis.updateData(vis.userId);
  }
}