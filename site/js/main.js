
disableScrolling();

// global objects
var data, localNetwork, largeNetwork, beeSwarm,
    globalTransactionBreakdown, localTransactionBreakdown,
    transactionsOverTime, localTransactionsOverTime,
    globalBrushingTimeline, localBrushingTimeline;

// for `labeledTransactions_small.csv`
var parseTime = d3.timeParse("%m/%d/%y %H:%M");

// for `transactions.csv` and `labeledTransactions.csv`
var parseTime2 = d3.timeParse("%Y-%m-%d %H:%M:%S");

const data_dir = 'data';

const categoriesColorScale = d3.scaleOrdinal()
  .domain(["Other", "Food", "Sex", "Events", "Transportation", "Drinks", "Drugs"])
  .range(["#809bce", "#c2a8d4", "#febd7e", "#f2f68f", "#3367b2", "#ff0079", "#cb4f00"]);

// user to initialize charts with: Francisco
var initialUser = 8443572;
var chosenUserId_global = initialUser;

queue()
    .defer(d3.csv, `${data_dir}/users.csv`)
    .defer(d3.csv, `${data_dir}/labeledTransactions.csv`)
    .defer(d3.csv, `${data_dir}/word_count.csv`)
    .await(dataLoaded);

function dataLoaded(error, _users, _labeledTransactions, _wordCount) {

    // parse the data and create the global data object

    _labeledTransactions.forEach(d => {
      d.from = +d.from;
      d.to = +d.to;
      d.payment_id = +d.payment_id;
      d.created_time = parseTime(d.created_time);
      d.updated_time = parseTime(d.updated_time);
    });

    _users.forEach(d => {
      d.Id = +d.Id;
      d.date_created = parseTime2(d.date_created);
      d.external_id = +d.external_id;
      d.cancelled = d.cancelled == 'True';
      d.is_business = d.is_business == 'True';
      d.is_crawled = d.is_crawled == 'True';
    });

    data = new DataWrapper(_labeledTransactions, _users);

    // Create the charts

    // Create global transaction breakdown pie chart
    globalTransactionBreakdown = new PieChart("transaction-breakdown", _labeledTransactions);

    // Create local transaction breakdown pie chart
    localTransactionBreakdown = new PieChart("transaction-breakdown-local", _labeledTransactions);

    // Track trends for transaction categories over time
    transactionsOverTime = new StackedAreaChart("transactionsOverTime", _labeledTransactions);

    // Track trends for a user
    localTransactionsOverTime = new StackedAreaChart("localTransactionsOverTime", _labeledTransactions);

    // Create Brushing Tools
    globalBrushingTimeline = new BrushingTimeline("brushing-timeline-global",
        _labeledTransactions, initialUser, brushedGlobal, "brush-global");

    localBrushingTimeline = new BrushingTimeline("brushing-timeline-local",
        _labeledTransactions, initialUser, brushedLocal, "brush-local");

    // Create word cloud
    _wordCount.forEach(d => {
        d.occurrences = +d.occurrences;
    })
    var wordcloud = new WordCloud("word-cloud", _wordCount);

    largeNetwork = new LocalNetwork(data, {
      margin: {top: 40, bottom: 40, left: 40, right: 40},
      width: 800,
      height: 500,
      divName: "large-graph",
      user: initialUser,
      radius: 2,
      changeUserCallback: updateGlobalCenter
    });

    function updateGlobalCenter(u) {
      largeNetwork.updateUser(u);
    }

    localNetwork = new LocalNetwork(data, {
      margin: {top: 40, bottom: 40, left: 40, right: 40},
      width: 400,
      height: 300,
      divName: "local-graph",
      user: initialUser,
      radius: 1,
      changeUserCallback: userFilter
    });

    beeSwarm = new BeeSwarm(data, initialUser, {
      margin: {top: 40, bottom: 40, left: 100, right: 40},
      width: 800,
      height: 500,
      parentDiv: "transaction-timeline"
    });

    $('#preloader').fadeOut();
    enableScrolling();

}

function userFilterFromInput() {
    var chosenUserId = +d3.select("#userIdInput").node().value;
    userFilter(chosenUserId);
}

// Function called when the user inputs a new user's ID to filter the local section by
function userFilter(chosenUserId) {
    chosenUserId_global = chosenUserId;
    var chosenUser = data.userMap.get(chosenUserId);
    var timerange = d3.brushSelection(d3.select(".brush-local").node()).map(localBrushingTimeline.x.invert);

    // Update html text to reflect new user
    d3.selectAll(".user-filter-name")
      .text(chosenUser.name);

    $('#userIdInput').val(chosenUserId);

    // Update charts to filter for this user
    
    localNetwork.updateUser(chosenUserId);

    beeSwarm.updateData(chosenUserId);

    localTransactionBreakdown.filterForUser(chosenUserId);

    localTransactionsOverTime.filterForUser(chosenUserId);

    localBrushingTimeline.filterForUser(chosenUserId);
}

// //React to 'brushedGlobal' event and update domain (x-scale; stacked area chart) if selection is not empty
function brushedGlobal() {
    var timerange = d3.brushSelection(d3.select(".brush-global").node()).map(globalBrushingTimeline.x.invert);
    globalTransactionBreakdown.filterForTimerange(timerange);
    globalBrushingTimeline.updateTimerangeText(timerange);
}

// React to 'brushedLocal' event and update domain (x-scale; stacked area chart) if selection is not empty
function brushedLocal() {
    var timerange = d3.brushSelection(d3.select(".brush-local").node()).map(localBrushingTimeline.x.invert);
    localTransactionBreakdown.filterForUserAndTimerange(chosenUserId_global, timerange);
    //beeSwarm.filterForTimerange(timerange);
    localBrushingTimeline.updateTimerangeText(timerange);
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

/*
    Footer Poppers
 */

function imagesPopper() {
    var popover = new Popper(ref, popper, options);
}

function librariesPopper() {

}







