# Vaultix Database Programming Documentation

This document outlines the advanced T-SQL programmable objects and SQL constructs implemented to power the intelligent Analytics BI and Dashboard engines for Vaultix. These objects shift intensive aggregations from the backend application to the database layer, ensuring high performance.

## 1. Advanced SQL Constructs Used
- **JOINs (INNER, LEFT)**: Extensively used to map `ExpenseHeader` to `DateDimension`, `Supplier`, `ExpenseStatus`, and `ExpenseLineItem`.
- **Nested Queries**: Used in `sp_GetDashboardStats` to dynamically calculate the most recent active transaction month for reporting period fallbacks.
- **HAVING Clause**: Used to filter grouped aggregates (e.g., retrieving only categories with `TotalSpend > 0` or suppliers with `COUNT(e.ExpenseID) > 0`).
- **UNION ALL**: Used to merge active warnings from the `BudgetAlert` table with dynamic system notices (like pending high-value expenses) into a single event stream.

## 2. Views
Views abstract complex multi-table relationships into flat, queryable virtual tables.
- **`vw_ExpenseSummary`**: Joins headers, status, dates, and supplier data to provide a flat snapshot of all expenses.
- **`vw_CategorySpendSummary`**: A materialized grouping of `ExpenseLineItem` aggregated at the month/year level, vastly simplifying budget calculations.

## 3. User-Defined Functions (UDFs)
Functions encapsulate reusable scalar calculations.
- **`fn_GetBudgetUtilization`**: Accepts Category, Month, and Year to return the exact percentage of budget utilized based on `vw_CategorySpendSummary`.
- **`fn_PredictNextMonthCategorySpend`**: Uses a subquery to average the last 3 active months of a specific category to project future costs.

## 4. Stored Procedures
Procedures handle the heavy-lifting queries executed directly by Node.js.
- **`sp_GetDashboardStats`**: Returns multiple recordsets (Metadata, KPIs, Category Spend, Top Suppliers, Payment Methods, Alerts) in a single execution context, drastically reducing round-trips from the Express API.
- **`sp_GetAnalyticsBI`**: Uses advanced cursors and statistical queries to produce historical spending aggregations and supplier efficiency profiles.

## 5. Cursors
Cursors are used inside our analytics procedures to perform row-by-row operations over a chronologically ordered dataset.
- **Usage in `sp_GetAnalyticsBI`**: A cursor (`cur_MonthlyHistorical`) fetches the total spend of the last 3 months, calculates a rolling moving average, and applies specific business-logic seasonal multipliers (e.g. Back-to-school 15% bump) to forecast the next month's spending.

## 6. Triggers
Triggers are implemented to ensure automated, real-time data integrity and proactive alerting.
- **`trg_CheckBudgetOnLineItem`**: An `AFTER INSERT, UPDATE` trigger on `ExpenseLineItem`. It automatically checks if the newly inserted expense pushes the category spend above 90% of the allocated budget. If so, it instantly logs an automated warning in `BudgetAlert` without needing application-side logic.
