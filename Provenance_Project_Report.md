# Provenance-Enabled Database Management System: LockerGo

## Cover Page
**Project Title:** LockerGo - Smart Locker Booking & Provenance System
**Scenario:** E-Commerce / Service Booking Application
**Objective:** Designing and implementing a provenance-enabled relational database management system to capture the "why," "where," and "how" of data evolution.

---

## 1. Introduction
In modern service-based applications, understanding the origin and transformation of data is essential for transparency, auditing, and dispute resolution. This project introduces **LockerGo**, a smart locker management system. Users can book lockers at various stations, make payments, and extend or cancel their bookings. 

Given the financial and temporal nature of these transactions, data provenance is critical. We implemented a comprehensive provenance tracking mechanism to capture:
*   **Why** a booking status or payment record changed.
*   **Where** the action originated (e.g., User App, Admin Dashboard, Receptionist Portal).
*   **How** the data evolved over time (from initial booking to completed or cancelled states).

## 2. Database Design
The core relational schema is designed to handle users, stations, lockers, bookings, and payment records. 

### Relational Schema (Key Tables)
```sql
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_lockers INTEGER NOT NULL,
    available_lockers INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    station_id VARCHAR(255) REFERENCES stations(id),
    locker_id VARCHAR(255),
    status VARCHAR(50),
    amount DECIMAL(10,2),
    due_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_records (
    id VARCHAR(255) PRIMARY KEY,
    booking_id VARCHAR(255) REFERENCES bookings(id),
    user_id VARCHAR(255) REFERENCES users(id),
    type VARCHAR(50),
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Audit Table Design
To log provenance data without disrupting core business operations, a dedicated `audit_logs` table was implemented.

### Description and SQL Code
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    actor_role VARCHAR(50),      -- e.g., 'user', 'admin', 'receptionist'
    actor_name VARCHAR(255),
    action_type VARCHAR(255),    -- e.g., 'booking_created', 'booking_cancelled'
    entity_type VARCHAR(255),    -- Source table: 'booking', 'payment', 'user'
    entity_id VARCHAR(255),      -- Row ID affected
    previous_value TEXT,         -- Data before change (JSON string)
    new_value TEXT,              -- Data after change (JSON string)
    station_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Explanation of Captured Metadata
*   **Operation Type (`action_type`):** Tracks the exact DML-equivalent operation (e.g., INSERT is `booking_created`, UPDATE is `profile_update` or `booking_extended`).
*   **Timestamp (`created_at`):** Exact time of the modification.
*   **User/Actor (`actor_role`, `actor_name`):** Identifies *who* initiated the change.
*   **State Tracking (`previous_value`, `new_value`):** Serialized JSON representations of the row before and after the transaction, allowing complete reconstruction of the state.

## 4. Trigger/Procedure Implementation
Instead of relying strictly on database-level SQL triggers which can be rigid, the application implements an **application-level procedure** that acts as a robust trigger. This ensures all cascading updates (e.g., a booking cancellation triggering a penalty payment) are wrapped in atomic audit trails.

### Application Trigger Code (Node.js/TypeScript)
```typescript
function addAudit(
  actorRole: string,
  actorName: string,
  actionType: string,
  entityType: string,
  entityId: string,
  previousValue: any,
  newValue: any,
  stationId: string | null = null
) {
  const audit = {
    id: `audit-${nextId++}`,
    actorRole,
    actorName,
    actionType,
    entityType,
    entityId,
    previousValue: typeof previousValue === 'object' ? JSON.stringify(previousValue) : previousValue,
    newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
    stationId,
    createdAt: new Date().toISOString()
  };
  
  // Insert provenance record into audit table upon changes
  pool.query(
    `INSERT INTO audit_logs (id, actor_role, actor_name, action_type, entity_type, entity_id, previous_value, new_value, station_id, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [audit.id, audit.actorRole, audit.actorName, audit.actionType, audit.entityType, audit.entityId, audit.previousValue, audit.newValue, audit.stationId, audit.createdAt]
  );
  return audit;
}
```

## 5. Provenance Queries
We designed specific queries to extract provenance data, reflecting the Why, Where, and How.

### 1. "Trace the status transitions of a specific Order" (HOW-Provenance)
This query reconstructs how a specific booking evolved over its lifecycle.
```sql
-- SQL Code
SELECT created_at, action_type, previous_value, new_value
FROM audit_logs
WHERE entity_type = 'booking' AND entity_id = 'booking-123'
ORDER BY created_at ASC;
```
*   **Interpretation:** Displays a chronological log showing a booking going from `booking_created` -> `booking_extended` -> `booking_completed`, including exact timestamp changes.

### 2. "List all price/payment changes for a Booking" (WHY-Provenance)
This query justifies *why* a user owes a specific due amount by tracing penalty and refund actions.
```sql
-- SQL Code
SELECT created_at, action_type, actor_name
FROM audit_logs
WHERE entity_type = 'payment_audit' AND entity_id = 'booking-123';
```
*   **Interpretation:** If a user asks why they were charged a penalty, this query returns the `booking_cancelled` action that automatically triggered the penalty payment record.

### 3. "Find all actions taken by a specific Receptionist" (WHERE-Provenance)
```sql
-- SQL Code
SELECT entity_type, action_type, entity_id, created_at
FROM audit_logs
WHERE actor_role = 'receptionist' AND actor_name = 'John Doe';
```
*   **Interpretation:** Traces the lineage of data modifications back to a specific source/actor, proving accountability for manual overrides or check-ins.

## 6. GUI Tool (Audit Engine)
A dedicated frontend GUI was developed as part of the Admin Dashboard to visualize provenance.
*   **Functionality:** The "Audit Engine" features live tabs filtering provenance by Staff, Bookings, Payments, and Reviews. It provides a visual timeline feed of `previous_value` vs `new_value`, allowing administrators to instantly see who changed what and when.
*   **Visual Trace:** The interface highlights changes in red/green (diff view) to demonstrate the derivation history without requiring administrators to write SQL manually.

## 7. Challenges and Lessons Learned
*   **Challenge:** Handling cascading updates. When a user cancels a booking, three things happen: the booking status updates, the locker becomes available, and a penalty payment is generated.
*   **Solution:** We learned to chain our procedural trigger (`addAudit`) sequentially within the transaction blocks to ensure each distinct DML operation generated its own linked provenance record.
*   **Lesson:** Serializing row data into text/JSON for the `previous_value` and `new_value` columns proved incredibly effective, avoiding the need for a separate audit table for every single business entity.

## 8. Conclusion
The implementation successfully embeds a robust provenance tracking system into the LockerGo application. By capturing the Why, Where, and How of data evolution through a centralized audit schema and procedural triggers, the system guarantees complete transparency. Future scope includes adding graphical lineage trees (node-link diagrams) to the GUI to visualize complex cascading updates across multiple tables simultaneously.

## 9. Appendix
*   **Database Engine:** PostgreSQL 16
*   **Backend Framework:** Node.js / Express
*   **Frontend GUI:** React / TypeScript / Tailwind CSS
