# Vaultix Database Changes Log

This document tracks all modifications, inspections, and schema alterations made to the remote SQL Server database for **Vaultix**.

---

## 1. Schema Inspection (2026-05-19)
Prior to making database modifications, the database schema was inspected to understand the existing tables.

### Existing Tables Identified:
- `DateDimension`, `SupplierCategory`, `SupplierType`, `Item`, `Supplier`, `SupplierAddress`, `SupplierContact`, `Role`, `Employee`, `EmployeeContact`, `ExpenseCategory`, `PaymentMethod`, `ExpenseStatus`, `ExpenseHeader`, `ExpenseLineItem`, `Budget`, `BudgetAlert`, `ApprovalLog`, `Receipt`, `SystemAuditLog`

### Structure of Existing `Employee` Table:
| Column Name | Data Type | Nullable | Max Length | Key / Notes |
|-------------|-----------|----------|------------|-------------|
| `EmployeeID` | `int`     | NO       | -          | Primary Key |
| `FirstName`  | `varchar` | NO       | 100        |             |
| `LastName`   | `varchar` | NO       | 100        |             |
| `RoleID`     | `int`     | NO       | -          | Foreign Key to `Role` |
| `HireDate`   | `date`    | NO       | -          |             |

### Structure of Existing `Role` Table:
| Column Name | Data Type | Nullable | Max Length | Key / Notes |
|-------------|-----------|----------|------------|-------------|
| `RoleID`     | `int`     | NO       | -          | Primary Key |
| `RoleName`   | `varchar` | NO       | 100        | UNIQUE      |

*Observation: The existing `Employee` table does not contain credentials (username, password/password hash), meaning login credentials must reside in a dedicated authentication table.*

---

## 2. Database Modifications

### 2.1 Table Creation: `[User]`
To implement authentication cleanly without breaking any constraints or schemas on the pre-existing `Employee` table, a dedicated `[User]` table was introduced to store login credentials and associate them with roles.

#### SQL DDL Statement:
```sql
CREATE TABLE [User] (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID INT FOREIGN KEY REFERENCES [Role](RoleID),
    FirstName VARCHAR(100) NULL,
    LastName VARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

### 2.2 Roles Synchronization
Ensured that the `"Admin"` role exists in the pre-existing `[Role]` table.
```sql
IF NOT EXISTS (SELECT 1 FROM [Role] WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO [Role] (RoleName) VALUES ('Admin');
END
```

### 2.3 Default Administrative User Seeding
Seeded a default system administrator user with secure credentials. The password `"admin1234"` is cryptographically hashed using **bcrypt** (10 salt rounds) before insertion.

#### Seeding SQL:
```sql
-- RoleID is retrieved dynamically corresponding to the 'Admin' role name
INSERT INTO [User] (Username, PasswordHash, RoleID, FirstName, LastName)
VALUES ('admin', '$2b$10$UoWpB5o...', @AdminRoleID, 'System', 'Administrator');
```

- **Username**: `admin`
- **Password**: `admin1234` (Stored as a secure bcrypt hash)
- **Assigned Role**: `Admin`

### 2.4 Expense Infrastructure Triggers
To support the new backend expense workflow, SQL Server triggers were added and applied from `backend/scripts/expenseInfrastructure.sql`.

#### Trigger: `trg_ExpenseHeader_Audit`
- Captures `INSERT`, `UPDATE`, and `DELETE` activity on `[ExpenseHeader]`.
- Writes a JSON snapshot of the changed row into `[SystemAuditLog]`.
- Keeps the audit trail in SQL Server even when changes are made outside the API.

#### Trigger: `trg_ExpenseLineItem_RecalculateHeaderTotal`
- Recalculates `[ExpenseHeader].[TotalAmount]` whenever related `[ExpenseLineItem]` rows change.
- Ensures header totals remain aligned with the sum of line items.

#### Backend API Added
- `GET /api/expenses`
- `GET /api/expenses/:id`
- `POST /api/expenses`
- `PUT /api/expenses/approve/:id`

The API uses the existing expense tables and the trigger layer to keep the audit log and totals synchronized.

---

## Summary of DB Changes Summary Table
| Event Date | Action Type | Object | Description |
|------------|-------------|--------|-------------|
| 2026-05-19 | Creation    | Table `[User]` | Created to isolate login credentials from general employee profiles. |
| 2026-05-19 | Verification| Table `[Role]` | Confirmed existing schema and ensured the `Admin` role is present. |
| 2026-05-19 | Seeding     | Record in `[User]` | Seeded default administrator account (`admin` / `admin1234`) with bcrypt hashing. |
| 2026-05-19 | Trigger     | `trg_ExpenseHeader_Audit` | Added expense header audit logging to `[SystemAuditLog]`. |
| 2026-05-19 | Trigger     | `trg_ExpenseLineItem_RecalculateHeaderTotal` | Added automatic header total recalculation from line items. |
