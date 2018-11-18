
var data, localNetwork;

var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

$(document).ready(() => {
  new fullpage('#fullpage', {
    auoscrolling: true,
    licenseKey: 'OPEN-SOURCE-GPLV3-LICENSE',
  });
});


d3.queue()
  .defer(d3.csv, "data/users.csv")
  .defer(d3.csv, "data/transactions.csv")
  .await((err, _users, _transactions) => {

    var loading = d3.select("#loading-text");
    
    loading.text("Processing data...");

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

    data = new DataWrapper(_transactions, _users);

    localNetwork = new LocalNetwork(data, {
      margin: {top: 40, bottom: 40, left: 40, right: 40},
      width: 760,
      height: 500,
      divName: "local-graph",
      user: 8443572,
      radius: 2
    });

    loading.text("Ready!");

  });
