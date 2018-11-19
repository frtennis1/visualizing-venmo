var data, localNetwork;

var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

queue()
  .defer(d3.csv, "data/users.csv")
  .defer(d3.csv, "data/transactions.csv")
  .defer(d3.csv, "data/labeledTransactions_small.csv")
  .await(dataLoaded);

function dataLoaded(error, _users, _transactions, _labeledTransactions) {

    // Create transaction breakdown pie chart
    var bdown = new PieChart("transaction-breakdown", _labeledTransactions);

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
      width: 400,
      height: 400,
      divName: "local-graph",
      user: 8443572,
      radius: 1
    });

}
