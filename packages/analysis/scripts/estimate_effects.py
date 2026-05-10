#!/usr/bin/env python3
"""Estimate simple Parcel Society treatment effects from exported CSV files.

Model for each outcome:
    outcome ~ high_inequality + uncertainty + high_inequality:uncertainty

The script accepts either a directory containing exported CSVs or a ZIP export.
It writes a small Markdown report; it intentionally uses only Python's standard
library so it can run in lightweight research environments.
"""

from __future__ import annotations

import argparse
import csv
import math
import zipfile
from pathlib import Path
from typing import Iterable

PRIMARY_OUTCOMES = [
    "informal_cooperation_rate",
    "contract_reliability",
    "productive_investment_share",
    "public_contribution_share",
    "exit_rate",
]

SECONDARY_OUTCOMES = [
    "safe_asset_share",
    "lobbying_share",
    "total_output",
    "treasury_balance",
    "active_players",
    "final_wealth_gini",
    "initial_parcel_quality_gini",
    "formal_contract_share",
    "average_wealth",
    "median_wealth",
]

SUMMARY_OUTCOMES = [
    "final_wealth_gini",
    "final_exit_rate",
    "final_contract_reliability",
    "final_public_contribution_share",
    "final_productive_investment_share",
]


def read_csv(source: Path, filename: str) -> list[dict[str, str]]:
    if source.is_file() and source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as archive:
            try:
                with archive.open(filename) as handle:
                    return list(csv.DictReader(line.decode("utf-8") for line in handle))
            except KeyError:
                return []
    path = source / filename
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def as_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        result = float(value)
    except ValueError:
        return None
    return result if math.isfinite(result) else None


def condition_flags(row: dict[str, str]) -> tuple[float, float]:
    inequality = row.get("inequality_condition") or row.get("treatment_inequality") or ""
    uncertainty = row.get("uncertainty_condition") or row.get("treatment_uncertainty") or ""
    return (1.0 if inequality.upper() == "HIGH" else 0.0, 1.0 if uncertainty.upper() == "UNCERTAIN" else 0.0)


def transpose(matrix: list[list[float]]) -> list[list[float]]:
    return [list(column) for column in zip(*matrix)]


def matmul(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    return [[sum(a * b for a, b in zip(row, column)) for column in transpose(right)] for row in left]


def invert(matrix: list[list[float]]) -> list[list[float]] | None:
    size = len(matrix)
    augmented = [row[:] + [1.0 if i == j else 0.0 for j in range(size)] for i, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            return None
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [value - factor * augmented[column][i] for i, value in enumerate(augmented[row])]
    return [row[size:] for row in augmented]


def ols(rows: Iterable[dict[str, str]], outcome: str) -> dict[str, float] | None:
    x: list[list[float]] = []
    y: list[list[float]] = []
    for row in rows:
        value = as_float(row.get(outcome))
        if value is None:
            continue
        high_inequality, uncertainty = condition_flags(row)
        x.append([1.0, high_inequality, uncertainty, high_inequality * uncertainty])
        y.append([value])
    if len(x) < 4:
        return None
    xt = transpose(x)
    xtx_inv = invert(matmul(xt, x))
    if xtx_inv is None:
        return None
    beta = matmul(matmul(xtx_inv, xt), y)
    predictions = matmul(x, beta)
    residuals = [observed[0] - predicted[0] for observed, predicted in zip(y, predictions)]
    rss = sum(residual * residual for residual in residuals)
    mean_y = sum(value[0] for value in y) / len(y)
    tss = sum((value[0] - mean_y) ** 2 for value in y)
    return {
        "n": float(len(y)),
        "intercept": beta[0][0],
        "high_inequality": beta[1][0],
        "uncertainty": beta[2][0],
        "interaction": beta[3][0],
        "r_squared": 0.0 if tss == 0 else 1 - rss / tss,
    }


def final_round_rows(round_rows: list[dict[str, str]], summary_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    conditions = {row["server_id"]: row for row in summary_rows if row.get("server_id")}
    latest: dict[str, dict[str, str]] = {}
    for row in round_rows:
        server_id = row.get("server_id")
        round_number = as_float(row.get("round"))
        if not server_id or round_number is None:
            continue
        previous = latest.get(server_id)
        previous_round = as_float(previous.get("round") if previous else None)
        if previous is None or previous_round is None or round_number > previous_round:
            latest[server_id] = row
    merged = []
    for server_id, row in latest.items():
        merged.append({**conditions.get(server_id, {}), **row})
    return merged


def markdown_table(results: list[tuple[str, dict[str, float] | None]]) -> str:
    lines = ["| Outcome | N | Intercept | High inequality | Uncertainty | Interaction | R² |", "|---|---:|---:|---:|---:|---:|---:|"]
    for outcome, result in results:
        if result is None:
            lines.append(f"| `{outcome}` | insufficient data |  |  |  |  |  |")
        else:
            lines.append(
                f"| `{outcome}` | {int(result['n'])} | {result['intercept']:.4f} | {result['high_inequality']:.4f} | "
                f"{result['uncertainty']:.4f} | {result['interaction']:.4f} | {result['r_squared']:.3f} |"
            )
    return "\n".join(lines)


def build_report(source: Path) -> str:
    summary_rows = read_csv(source, "server_summary.csv")
    round_rows = final_round_rows(read_csv(source, "round_outcomes.csv"), summary_rows)
    primary = [(outcome, ols(round_rows, outcome)) for outcome in PRIMARY_OUTCOMES]
    secondary = [(outcome, ols(round_rows, outcome)) for outcome in SECONDARY_OUTCOMES]
    summary = [(outcome, ols(summary_rows, outcome)) for outcome in SUMMARY_OUTCOMES]
    return "\n\n".join([
        "# Parcel Society treatment-effect estimates",
        "Model: `outcome ~ high_inequality + uncertainty + high_inequality:uncertainty`.",
        "These are simple OLS estimates for quick diagnostics; they do not apply clustered standard errors.",
        "## Primary final-round outcomes",
        markdown_table(primary),
        "## Secondary final-round outcomes",
        markdown_table(secondary),
        "## Server-summary outcomes",
        markdown_table(summary),
    ]) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Estimate simple Parcel Society treatment effects from exported CSVs.")
    parser.add_argument("source", type=Path, help="Directory containing CSVs or an exported ZIP file.")
    parser.add_argument("-o", "--output", type=Path, default=Path("treatment-effects.md"), help="Markdown report path.")
    args = parser.parse_args()
    report = build_report(args.source)
    args.output.write_text(report, encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
