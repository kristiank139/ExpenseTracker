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
                "content": "You will be given a JSON string containing payment explanations as keys and the amount that was spent as their values. You should categorize these purchases based on the payment explanation into five different groups: 'Groceries', 'Eating out' (fast food chains, restaurants), 'Items' (like electronics, books, clothes), 'Transport', 'Other' (if you're unsure or other categories don't apply). Return a JSON string containing the n-th purchase as keys as such: '{0: {category: 'category', amount: 'amount'}, 1: etc...}'. Make sure all float numbers use dots not commas. Only output raw JSON.",
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

def reorganize_payment_data(explanations_amounts, payment_categories, categorized_payments, row_amount, income_data):
    reorganized_payment_data = {"payment_data":
        {payment_category: {"amount": 0, "payments": []} for payment_category in payment_categories},
        "income_data": income_data
    }

    # Add spending amounts and explanations to data
    for i in range(row_amount):
        reorganized_payment_data["payment_data"][categorized_payments[str(i)]["category"]]["amount"] += float(categorized_payments[str(i)]["amount"])

        reorganized_payment_data["payment_data"][categorized_payments[str(i)]["category"]]["payments"].append({mask_card_number(explanations_amounts[i]["explanation"]): categorized_payments[str(i)]["amount"]})
    
    return reorganized_payment_data

payment_categories = ["Groceries", "Transport", "Eating out", "Items", "Other"]
df = pd.read_csv(csv_path, delimiter=";")

client = OpenAI()

unnecessary_row_tags = ["Algsaldo", "Käive", "lõppsaldo"]

row_amount = 10

expense_df = df[~df["Selgitus"].isin(unnecessary_row_tags)]
income_df = expense_df[df["Deebet/Kreedit"] == "K"]
expense_df = df[df["Deebet/Kreedit"] != "K"]

payment_explanations = expense_df["Selgitus"].head(row_amount).tolist()
payment_amounts = expense_df["Summa"].head(row_amount).tolist()
income_amounts = income_df["Summa"].head(5).tolist() # Need to get head length!

payment_data = [{"explanation": e.replace("'", ""), "amount": a} for e, a in zip(payment_explanations, payment_amounts)]
income_data = {"income": [income_amount.replace(",", ".") for income_amount in income_amounts]}


categorized_payments = categorize_payments(payment_data)

print(json.dumps(reorganize_payment_data(payment_data, payment_categories, categorized_payments, row_amount, income_data)))


