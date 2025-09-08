import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
import json
import os, sys
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(script_dir, ".env")
unique_ids = [] # Default unique IDs to ignore

if len(sys.argv) == 1:
    csv_path = os.path.join(script_dir, "statement-3.csv")
else:
    csv_path = sys.argv[1]
    unique_ids = json.loads(sys.argv[2]) # Get unique IDs from command line arguments

load_dotenv(dotenv_path)


# Going over 30 rows at a time can give inaccurate results
def categorize_payments(payment_data):
    openai_response = client.responses.create(
        model = "gpt-4.1",
        input = [
            {
                "role": "developer",
                "content": "You will be given a JSON string containing payment descriptions as keys and the amount that was spent as their values. You should categorize these purchases based on the payment description into five different groups: 'Groceries', 'Eating out' (fast food chains, restaurants), 'Items' (like electronics, books, clothes), 'Transport', 'Other' (if you're unsure or other categories don't apply). Return a JSON string containing the n-th purchase as keys as such: '{0: category, 1: category, 2: etc...}'. Categories are lowercase, only output raw JSON.",
            },
            {
                "role": "user",
                "content": json.dumps(payment_data, ensure_ascii=False, indent=2)
            }
        ]
    )

    return json.loads(openai_response.output_text)

def mask_card_number(text):
    pattern = r'(\d{6})\*{6}(\d{4})'

    return re.sub(pattern, r'•••• \2', text)

def reorganize_payment_data(expenseData, incomeData, categorized_payments):
    categoryCount = int(list(categorized_payments.keys())[-1]) + 1 # In case the AI returns less categories than payments
    # Add categories to expense data
    for n in range(categoryCount):
        expenseData[n]["category"] = categorized_payments[str(n)]

    expenseData = sorted(expenseData, key=lambda x: x['date'], reverse=True) # Sort by date, newest first
    incomeData = sorted(incomeData, key=lambda x: x['date'], reverse=True) # Sort by date, newest first

    expense_income_data = {
        "payment_data": expenseData,
        "income_data": incomeData
    }
    return expense_income_data

payment_categories = ["Groceries", "Transport", "Eating out", "Items", "Other"]
df = pd.read_csv(csv_path, delimiter=";")

client = OpenAI()

unnecessary_row_tags = ["Algsaldo", "Käive", "lõppsaldo"]

row_amount = 30

payments_df = df[~df["Selgitus"].isin(unnecessary_row_tags)] # Remove unnecessary rows
payments_df = payments_df.head(row_amount)

if unique_ids:
    payments_df = payments_df[~payments_df["Arhiveerimistunnus"].isin(unique_ids)] # Remove already added payments

if payments_df["Arhiveerimistunnus"].empty: # If there are no new payments to add, no API request is made
    print(json.dumps({"payment_data": [], "income_data": []}))
    sys.exit(0)

income_df = payments_df[payments_df["Deebet/Kreedit"] == "K"]
expense_df = payments_df[payments_df["Deebet/Kreedit"] != "K"]

payment_unique_id = expense_df["Arhiveerimistunnus"].tolist()
payment_descriptions = expense_df["Selgitus"].tolist()
payment_descriptions_cleaned = [re.sub(r"\d{6}\*+\d+|\b\d{2}\.\d{2}\.\d{2,4}\b", " ", e.replace("'", "")) for e in payment_descriptions] # Clean descriptions for AI categorization
payment_dates = expense_df["Kuupäev"].tolist()
payment_amounts = expense_df["Summa"].tolist()

income_descriptions = income_df["Selgitus"].tolist()
income_dates = income_df["Kuupäev"].tolist()
income_unique_id = income_df["Arhiveerimistunnus"].tolist()
income_amounts = income_df["Summa"].tolist()

expenseData = [{"description": re.sub(r"\d{6}\*+\d+", " ", e.replace("'", "")), "amount": a.replace(",", "."), "date": d, "unique_id": int(i)} for e, a, d, i in zip(payment_descriptions, payment_amounts, payment_dates, payment_unique_id)]
incomeData = [{"description": e.replace("'", ""), "amount": a.replace(",", "."), "date": d, "unique_id": str(i)} for e, a, d, i in zip(income_descriptions, income_amounts, income_dates, income_unique_id)]

AI_categorized_payments = categorize_payments(payment_descriptions_cleaned)

print(json.dumps(reorganize_payment_data(expenseData, incomeData, AI_categorized_payments)))
