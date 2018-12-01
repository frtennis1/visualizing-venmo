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
    var data = this;

    this.adj = d3.nest()
      .key(d => d.from)
      .rollup(arr => arr.map(d => d.to))
      .map(this.transactions);

    // add in the reverse
    d3.nest()
      .key(d => d.to)
      .rollup(arr => arr.map(d => d.from))
      .map(this.transactions)
      .each((val, key) => {
        if (this.adj.has(key))
          this.adj.set(key, this.adj.get(key).concat(val));
        else
          this.adj.set(key, val);
      });

    this.users.forEach(d => {
      if (data.adj.has(d.Id))
        d.num_transactions = data.adj.get(d.Id).length;
      else
        d.num_transactions = 0;
      });

    this.userMap = d3.nest()
      .key(d => d.Id)
      .rollup(arr => arr[0])
      .map(this.users);

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
        val.id = val.source + "," + val.target;
      });

    this.edges = this.edges.values();

  }

  // get all users within a radius of the base user
  // don't return more than 200 nodes
  getUserNeighborhood(user, radius) {
    var nodes = d3.set().add(user);
    for (var i = 0; i < radius; i++) {
      nodes.each(n => {
        if (this.adj.has(n))
          this.adj.get(n).forEach(nn => nodes.add(nn))
      });
    }
    return nodes.values()
      .filter(d => data.userMap.get(d).is_crawled)
      .map(d => {
        var u = data.userMap.get(d);
        if (d == user)
          u.group = 1;
        else
          u.group = 0;
        return u;
      })
      .slice(0,200);
  }

  // return any edges between an iterable of users
  getRelevantEdges(users) {
    var userSet = d3.set(users, u => u.Id);

    var edges = this.edges.filter(e => 
      userSet.has(e.source) && userSet.has(e.target)
    ).map(e => JSON.parse(JSON.stringify(e)));

    edges.forEach(e => {
      e.transactions.forEach(t => {
        t.created_time = new Date(t.created_time);
        t.updated_time = new Date(t.created_time);
      });
    });

    return edges;
  }

  getUserTransactions(userId) {
    return this.transactions.filter(d => (
      d.to == userId || d.from == userId));
  }
}
