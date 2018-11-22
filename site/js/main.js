
disableScrolling();

var localTransactionBreakdown;

var data, localNetwork;

//var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var parseTime = d3.timeParse("%m/%d/%y %H:%M");

queue()
    .defer(d3.csv, "data/users.csv")
    .defer(d3.csv, "data/transactions.csv")
    .defer(d3.csv, "data/labeledTransactions_small.csv")
    .defer(d3.csv, "data/word_count.csv")
    .defer(d3.csv, "data/stackedTransactions.csv")
    .await(dataLoaded);

function dataLoaded(error, _users, _transactions, _labeledTransactions, _wordCount, _stackedTransactions) {

    // Create global transaction breakdown pie chart
    var globalTransactionBreakdown = new PieChart("transaction-breakdown", _labeledTransactions);

    // Create local transaction breakdown pie chart
    localTransactionBreakdown = new PieChart("transaction-breakdown-local", _labeledTransactions);

    //var transactionsOverTime = new StackedAreaChart("transactionsOverTime", _stackedTransactions);
    var transactionsOverTime = new StackedAreaChart("transactionsOverTime", _labeledTransactions);

    // Create word cloud
    var wordcloud = new WordCloud("word-cloud", _wordCount);

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

    /*data = new DataWrapper(_transactions, _users);

    localNetwork = new LocalNetwork(data, {
      margin: {top: 40, bottom: 40, left: 40, right: 40},
      width: 400,
      height: 400,
      divName: "local-graph",
      user: 8443572,
      radius: 1
    });*/

    $('#preloader').fadeOut();
    enableScrolling();

}

// Function called when the user inputs a new user's ID to filter by
function userFilter() {

    var chosenUserId = +d3.select("#userIdInput").node().value;

    // Update html text to reflect new user
    // Update charts to filter for this user

    localTransactionBreakdown.filterForUser(chosenUserId);

}

/*
    Handling for How To Section
 */

var currentHowTo = 0;
var slides = [
    "<h3>When you open Venmo, it should look a little like this. This is your home screen. Press the <span class='highlight'>Menu</span> button in the top left to open the menu.</h3>",
    "<h3>A sidebar will open up on top of your home page. Click the <span class='highlight'>Settings</span> button.</h3>",
    "<h3>Click on the <span class='highlight'>Privacy</span> button to open up your privacy settings.</h3>",
    "<h3>Click on the <span class='highlight'>Private</span> button to make all future Venmo transactions private by default. Don't forget to change your past transactions too thought!</h3>",
    "<h3>Click the <span class='highlight'>Past Transactions</span> button to retroactively change the privacy settings of past transactions.</h3>",
    "<h3>Click the <span class='highlight'>Change All to Private</span> button to instantly protect your entire Venmo history. That's it! Venmo will no longer serve your transactions through their public API.</h3>"
];
// Function called when the user clicks on the next button in the how to section
function howToButtonNext() {
    currentHowTo += 1;
    howToButtonPress();
}
function howToButtonPrev() {
    currentHowTo -= 1;
    howToButtonPress();
}
function howToButtonPress() {
    d3.select("#howToImage").style("opacity", 0).attr("src", "img/howto/howto"+currentHowTo+".PNG");
    d3.select("#howToImage").transition().duration(700).ease(d3.easeLinear).style("opacity", 1);
    // Disable the previous button if on the first page
    d3.select("#howToPrev").classed("disabled", (currentHowTo == 0));
    // Have the next button say start over if on the last page
    d3.select("#howToNext").classed("disabled", (currentHowTo == slides.length - 1));
    // Update the instructions
    d3.select("#howToText").html(slides[currentHowTo]);
}
howToButtonPress();