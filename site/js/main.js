
queue()
    .defer(d3.csv,"data/transactionBreakdown.csv")
    .await(dataLoaded);

function dataLoaded(error, breakdownData) {

    // Create transaction breakdown pie chart
    var bdown = new PieChart("transaction-breakdown", breakdownData);

}