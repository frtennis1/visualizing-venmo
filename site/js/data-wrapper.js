// This class abstracts away the data manipulation routines needed to wrangle
// the data into forms that are useful across many different charts. It also
// houses logic for filtering that affects charts across the entire website.

class DataWrapper {
  constructor(_transactions, _users) {
    this.transactions = _transactions;
    this.users = _users;

    this.redundantStores();
  }

  // update any redundant data stores from `transactions` and `users` which are
  // the ground truth
  redundantStores() {
    this.adj = d3.nest()
      .key(d => d.from)
      .rollup(arr => arr.map(d => d.to))
      .map(this.transactions);

    // add in the reverse
    d3.nest()
      .key(d => d.to)
      .rollup(arr => arr.map(d => d.from))
      .map(this.transactions)
      .each((key, val) => {
        if (this.adj.has(key))
          this.adj.set(key, this.adj.get(key).concat(val));
        else
          this.adj.set(key, val);
      });

    this.edges = d3.nest()
      .key(d => d3.min([d.to, d.from]) + "," + d3.max([d.to, d.from]))
      .rollup(transacts => ( {
        transactions: transacts,
        num_transactions: transacts.length
      }))
      .map(this.transactions);

    this.edges
      .each((val, key) => {
        [val.source, val.target] = key.split(',').map(x => +x);
      });

    this.edges = this.edges.values();

  }

  // get all users within a radius of the base user
  getUserNeighborhood(user, radius) {
    var nodes = d3.set().add(user);
    for (var i = 0; i < radius; i++) {
      nodes.each(n => {
        if (this.adj.has(n))
          this.adj.get(n).forEach(nn => nodes.add(nn))
      });
    }
    return nodes.values();
  }

  // return any edges between an iterable of users
  getRelevantEdges(users) {
    var userSet = d3.set(users);

    return this.edges.filter(e => 
      userSet.has(e.source) && userSet.has(e.target)
    );
  }



}
