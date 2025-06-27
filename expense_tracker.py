# 1) Categorize expenses?, could create categories and add specific sum to it

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv(".env")
df = pd.read_csv("statement-2.csv", delimiter=";")

client = OpenAI()

unnecessary_row_tags = ["Algsaldo", "Käive", "lõppsaldo"]

row_amount = 5

df = df[~df["Selgitus"].isin(unnecessary_row_tags)]
content = ";".join(df["Selgitus"].head(row_amount).tolist())

spendings = {
    "groceries": 0,
    "transport": 0,
    "subscriptions": 0,
    "eating out": 0,
    "items": 0,
    "other": 0
    }

print("Starting response")
openai_response = client.responses.create(
    model = "gpt-4.1",
    input = [
        {
            "role": "developer",
            "content": "You will be given a list of strings, each seperated by a semicolon as a delimiter and containing explanations of payments made. You should categorize these purchases based on the payment explanation into six different groups: 'groceries', 'eating out', 'items', 'transport', 'subscriptions', 'other'. Categorize even duplicates, don't group multiple payments into one. Return only the explanations and their corresponding values in raw json format. Do not include any formatting, markdown, or text outside the JSON.",
        },
        {
            "role": "user",
            "content": content
        }
    ]
)
print("responded")

categorized_payments = json.loads(openai_response.output_text)

print(categorized_payments)

for i in range(row_amount):
    spendings[categorized_payments[i]["category"]] += float(df.iloc[i]["Summa"].replace(",", "."))

print(spendings)

