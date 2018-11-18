
queue()
    .defer(d3.csv,"data/labeledTransactions_small.csv")
    .await(dataLoaded);

function dataLoaded(error, transactions) {

    // Create transaction breakdown pie chart
    var bdown = new PieChart("transaction-breakdown", transactions);

}