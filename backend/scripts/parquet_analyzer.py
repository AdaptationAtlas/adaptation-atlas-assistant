#!/usr/bin/env python3
"""
Script to analyze parquet files listed in dbSetup.json
Opens each parquet file and displays its structure and head data
"""

import io
import json
import sys
from pathlib import Path
from typing import Any

import boto3
import pandas as pd


def load_parquet_config(json_file_path: str) -> list[dict[str, Any]]:
    """Load and parse the JSON configuration file"""
    try:
        with open(json_file_path) as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"Error: File {json_file_path} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file_path}: {e}")
        sys.exit(1)


def read_parquet_from_s3(s3_path: str) -> pd.DataFrame | None:
    """Read parquet file from S3 using boto3"""
    try:
        # Parse S3 path
        if not s3_path.startswith("s3://"):
            raise ValueError(f"Invalid S3 path: {s3_path}")

        # Remove s3:// prefix and split bucket/key
        path_parts = s3_path[5:].split("/", 1)
        if len(path_parts) != 2:
            raise ValueError(f"Invalid S3 path format: {s3_path}")

        bucket_name, key = path_parts

        # Create S3 client
        s3_client = boto3.client("s3")

        # Download parquet file to memory
        response = s3_client.get_object(Bucket=bucket_name, Key=key)
        parquet_data = response["Body"].read()

        # Read parquet from bytes
        df = pd.read_parquet(io.BytesIO(parquet_data))
        return df

    except Exception as e:
        print(f"Error reading {s3_path}: {e}")
        return None


def display_table_info(df: pd.DataFrame, table_name: str, info: str) -> None:
    """Display table structure and head data"""
    print("=" * 80)
    print(f"TABLE: {table_name}")
    print("=" * 80)

    if info:
        print(f"INFO: {info}")
        print("-" * 80)

    if df is None:
        print("ERROR: Could not read table")
        return

    # Display basic info
    print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    print()

    # Display column information
    print("COLUMN INFORMATION:")
    print("-" * 40)
    for i, (col, dtype) in enumerate(df.dtypes.items()):
        non_null_count = df[col].count()
        null_count = df.shape[0] - non_null_count
        print(
            f"{i + 1:2d}. {col:<30} | {str(dtype):<15} | Non-null: {non_null_count:>8} | Null: {null_count:>6}"
        )
    print()

    # Display data types summary
    print("DATA TYPES SUMMARY:")
    print("-" * 40)
    dtype_counts = df.dtypes.value_counts()
    for dtype, count in dtype_counts.items():
        print(f"{str(dtype):<20}: {count:>3} columns")
    print()

    # Display head of the dataset
    print("HEAD OF DATASET (first 10 rows):")
    print("-" * 40)
    try:
        # Display with all columns visible
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", None)
        pd.set_option("display.max_colwidth", 50)
        print(df.head(10).to_string())
    except Exception as e:
        print(f"Error displaying head: {e}")
        # Fallback: show basic info
        print(f"First few rows (shape: {df.head(5).shape}):")
        print(df.head(5))
    finally:
        # Reset pandas options
        pd.reset_option("display.max_columns")
        pd.reset_option("display.width")
        pd.reset_option("display.max_colwidth")

    print("\n" + "=" * 80 + "\n")


def main():
    """Main function to process all parquet files"""
    # Path to the JSON file
    json_file_path = Path(__file__).parents[1] / "data" / "datasets.json"

    print("Loading parquet file configuration...")
    config_data = load_parquet_config(json_file_path)

    # Filter for active parquet files only
    active_parquet_files = [
        item
        for item in config_data
        if item.get("active", False)
        and item.get("s3")
        and item["s3"].endswith(".parquet")
    ]

    print(f"Found {len(active_parquet_files)} active parquet files to analyze")
    print("=" * 80)

    # Process each parquet file
    for i, item in enumerate(active_parquet_files, 1):
        key = item.get("key", "unknown")
        name = item.get("name", "unknown")
        info = item.get("info", "")
        s3_path = item.get("s3", "")

        print(f"\nProcessing {i}/{len(active_parquet_files)}: {key}")
        print(f"S3 Path: {s3_path}")

        # Read the parquet file
        df = read_parquet_from_s3(s3_path)

        # Display information
        if not df.empty:
            display_table_info(df, name, info)
        else:
            print("Could not display table information, no data frame retrieved")
            return

        # Add a small delay to avoid overwhelming the system
        import time

        time.sleep(0.1)

    print("Analysis complete!")


if __name__ == "__main__":
    main()
