import pandas as pd
import builtins

df = pd.read_parquet('groundsource_2026.parquet')
print("--- DATAFRAME INFO ---")
print(df.info())
print("\n--- FIRST 5 ROWS ---")
print(df.head())
print("\n--- SAMPLE ROW ---")
# Just print the dict, python can print bytes fine
print(df.head(1).to_dict('records')[0])
