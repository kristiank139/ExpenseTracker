import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
import json
import os, sys
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(script_dir, ".env")

if len(sys.argv) == 1:
    csv_path = os.path.join(script_dir, "statement.csv")
else:
    csv_path = sys.argv[1]

load_dotenv(dotenv_path)

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

    print(json.loads(openai_response.output_text))

    return json.loads(openai_response.output_text)

def mask_card_number(text):
    pattern = r'(\d{6})\*{6}(\d{4})'

    return re.sub(pattern, r'•••• \2', text)

def reorganize_payment_data(expenseData, incomeData, categorized_payments):
    # Add categories to expense data
    for n in categorized_payments:
        expenseData[int(n)]["category"] = categorized_payments[n]

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

row_amount = 10

payments_df = df[~df["Selgitus"].isin(unnecessary_row_tags)]
income_df = payments_df[payments_df["Deebet/Kreedit"] == "K"]
expense_df = payments_df[payments_df["Deebet/Kreedit"] != "K"]

payment_descriptions = expense_df["Selgitus"].head(row_amount).tolist()
payment_dates = expense_df["Kuupäev"].head(row_amount).tolist()
payment_unique_id = expense_df["Arhiveerimistunnus"].head(row_amount).tolist()
payment_amounts = expense_df["Summa"].head(row_amount).tolist()

income_descriptions = income_df["Selgitus"].head(5).tolist()
income_dates = income_df["Kuupäev"].head(5).tolist()
income_unique_id = income_df["Arhiveerimistunnus"].head(5).tolist()
income_amounts = income_df["Summa"].head(5).tolist() # Need to get head length!

expenseData = [{"description": re.sub(r"\d{6}\*+\d+|\b\d{2}\.\d{2}\.\d{2,4}\b", " ", e.replace("'", "")), "amount": a.replace(",", "."), "date": d, "unique_id": int(i)} for e, a, d, i in zip(payment_descriptions, payment_amounts, payment_dates, payment_unique_id)]
incomeData = [{"description": e.replace("'", ""), "amount": a.replace(",", "."), "date": d, "unique_id": int(i)} for e, a, d, i in zip(income_descriptions, income_amounts, income_dates, income_unique_id)]

AI_categorized_payments = categorize_payments(payment_descriptions)

print(json.dumps(reorganize_payment_data(expenseData, incomeData, AI_categorized_payments)))
