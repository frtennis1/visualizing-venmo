CS 171 Final Project: Visualizing Venmo
=======================================

Team
----
- Francisco Rivera
- Elana Shen
- David Miller
- Jack Obeng-Marnu

Notebooks
---------

- [Harvard Scraper](Harvard%20Scraper.ipynb) Scrapes Harvard for a list of names
  that are of interest for the Venmo scraper.

- [Venmo Scraper](Venmo%20Scraper.ipynb) Scrapes Venmo for user data and stores
  it into the `data/raw` directory. It can start parsing from an arbitrary user
  ID, or it can be handed a list of IDs to scrape by the Database Creator
  Notebook.

- [Database Creator](Database%20Creator.ipynb) Accepts the API call files in
  `data/raw` and uses them to generate more useful transactions and users
  dataframes which it stores in `data/processed` as
  `data/processed/transactions.csv` and `data/processed/users.csv`. Currently,
  this notebook also houses the code that takes the processed data and exports
  it to subset graph `json` files for ingestion by the website, but this should
  be refactored elsewhere. 


