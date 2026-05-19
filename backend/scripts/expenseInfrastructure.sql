-- ============================================================
-- Vaultix Expense Backend Infrastructure
-- Adds SQL Server triggers for audit and expense total control
-- ============================================================

USE Vaultix;
GO

CREATE OR ALTER TRIGGER dbo.trg_ExpenseHeader_Audit
ON dbo.ExpenseHeader
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'ExpenseHeader',
            'INSERT',
            i.ExpenseID,
            NULL,
            (
                SELECT
                    i.ExpenseID AS ExpenseID,
                    i.DateKey AS DateKey,
                    i.SupplierID AS SupplierID,
                    i.EmployeeID AS EmployeeID,
                    i.PaymentMethodID AS PaymentMethodID,
                    i.StatusID AS StatusID,
                    i.TotalAmount AS TotalAmount,
                    i.Description AS Description
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            GETDATE()
        FROM inserted i;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'ExpenseHeader',
            'UPDATE',
            i.ExpenseID,
            (
                SELECT
                    d.ExpenseID AS ExpenseID,
                    d.DateKey AS DateKey,
                    d.SupplierID AS SupplierID,
                    d.EmployeeID AS EmployeeID,
                    d.PaymentMethodID AS PaymentMethodID,
                    d.StatusID AS StatusID,
                    d.TotalAmount AS TotalAmount,
                    d.Description AS Description
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            (
                SELECT
                    i.ExpenseID AS ExpenseID,
                    i.DateKey AS DateKey,
                    i.SupplierID AS SupplierID,
                    i.EmployeeID AS EmployeeID,
                    i.PaymentMethodID AS PaymentMethodID,
                    i.StatusID AS StatusID,
                    i.TotalAmount AS TotalAmount,
                    i.Description AS Description
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            GETDATE()
        FROM inserted i
        INNER JOIN deleted d ON d.ExpenseID = i.ExpenseID;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'ExpenseHeader',
            'DELETE',
            d.ExpenseID,
            (
                SELECT
                    d.ExpenseID AS ExpenseID,
                    d.DateKey AS DateKey,
                    d.SupplierID AS SupplierID,
                    d.EmployeeID AS EmployeeID,
                    d.PaymentMethodID AS PaymentMethodID,
                    d.StatusID AS StatusID,
                    d.TotalAmount AS TotalAmount,
                    d.Description AS Description
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            NULL,
            GETDATE()
        FROM deleted d;
    END
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_ExpenseLineItem_RecalculateHeaderTotal
ON dbo.ExpenseLineItem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedExpenses AS (
        SELECT ExpenseID FROM inserted
        UNION
        SELECT ExpenseID FROM deleted
    )
    UPDATE eh
    SET TotalAmount = COALESCE(total_lines.TotalLineAmount, 0)
    FROM ExpenseHeader eh
    INNER JOIN AffectedExpenses ae ON ae.ExpenseID = eh.ExpenseID
    OUTER APPLY (
        SELECT SUM(eli.LineTotal) AS TotalLineAmount
        FROM ExpenseLineItem eli
        WHERE eli.ExpenseID = eh.ExpenseID
    ) total_lines;
END;
GO