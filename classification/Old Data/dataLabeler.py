import pandas as pd 
import numpy as np 

NUMBER_TO_LABEL = 20

filename = "transactions_labeled.csv"
output_filename = "transactions_labeled.csv"

df = pd.read_csv(filename)

def getInput():
    categories = {
        "f": "Food",
        "d": "Drinks",
        "w": "Drugs",
        "u": "Uber",
        "s": "Sex",
        "o": "Other"
    }
    name = input("Category: ")
    while name not in categories:
        name = input("Category: ")
    return categories[name]

if "category" not in df:
    df["category"] = ""

i = 0
for index, row in df.iterrows():
    if row["category"]:
        continue
    print(row["message"])
    category = getInput()
    df.at[index, "category"] = category
    i += 1
    if i >= NUMBER_TO_LABEL:
        break

df.to_csv(output_filename)


