# 1) Categorize expenses?, could create categories and add specific sum to it

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv(".env")

def categorize_payments(payment_data):
    print("Creating response")
    openai_response = client.responses.create(
        model = "gpt-4.1",
        input = [
            {
                "role": "developer",
                "content": "You will be given a JSON string containing payment explanations as keys and the amount that was spent as their values. You should categorize these purchases based on the payment explanation into five different groups: 'groceries', 'eating out' (fast food chains, restaurants), 'items' (like electronics, books, clothes), 'transport', 'other' (if you're unsure or other categories don't apply). Return a JSON string containing the n-th purchase as keys as such: '{0: {category: 'category', amount: 'amount'}, 1: etc...}'. Make sure all float numbers use dots not commas. Only output raw JSON.",
            },
            {
                "role": "user",
                "content": json.dumps(payment_data, ensure_ascii=False, indent=2)
            }
        ]
    )
    print("responded")

    return json.loads(openai_response.output_text)

df = pd.read_csv("statement-2.csv", delimiter=";")

client = OpenAI()

unnecessary_row_tags = ["Algsaldo", "Käive", "lõppsaldo"]

row_amount = 20

df = df[~df["Selgitus"].isin(unnecessary_row_tags)]
df = df[df["Deebet/Kreedit"] != "K"]
payment_explanations = df["Selgitus"].head(row_amount).tolist()
payment_amounts = df["Summa"].head(row_amount).tolist()

explanations_amounts_json = [{"explanation": e, "amount": a} for e, a in zip(payment_explanations, payment_amounts)]

print(explanations_amounts_json)

spendings = {
    "groceries": 0,
    "transport": 0,
    "eating out": 0,
    "items": 0,
    "other": 0
    }

print("--------------")
print(json.dumps(explanations_amounts_json))

categorized_payments = categorize_payments(explanations_amounts_json)

#categorized_payments = {'groceries': {'amount': 64.56, 'indices': [4, 6, 12, 15, 16, 17, 19]}, 'eating out': {'amount': 42.39, 'indices': [3, 14, 15, 18]}, 'items': {'amount': 54.18, 'indices': [5, 10, 11]}, 'transport': {'amount': 44.16, 'indices': [2, 7, 8, 9]}, 'subscriptions': {'amount': 0.0, 'indices': []}, 'other': {'amount': 18.69, 'indices': [0, 1, 13]}}

print(categorized_payments)

for i in range(row_amount):
    spendings[categorized_payments[str(i)]['category']] += float(df.iloc[i]["Summa"].replace(",", "."))

print(spendings)

