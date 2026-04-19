const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password123@localhost:5432/smart_tourist_db' });

async function fix() {
  const reviewsRes = await pool.query('SELECT data FROM smart_tourist_reviews');
  const reviews = reviewsRes.rows.map(r => r.data);
  
  const auditRes = await pool.query("SELECT id FROM smart_tourist_audit_logs WHERE data->>'entityType' = 'review'");
  const existingAuditIds = auditRes.rows.map(r => r.id);
  
  console.log(`Found ${reviews.length} reviews and ${existingAuditIds.length} existing audit logs.`);

  let count = 0;
  for (const review of reviews) {
    // Check if an audit log for this review ID exists
    const hasAudit = await pool.query("SELECT id FROM smart_tourist_audit_logs WHERE data->>'entityId' = $1", [review.id]);
    
    if (hasAudit.rows.length === 0) {
      const auditId = `audit-migration-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const audit = {
        id: auditId,
        actorRole: "user",
        actorName: review.userName,
        actionType: "SUBMIT_REVIEW",
        entityType: "review",
        entityId: review.id,
        previousValue: "none",
        newValue: `${review.rating} stars: ${review.text.slice(0, 50)}...`,
        stationId: null,
        createdAt: review.createdAt
      };
      
      await pool.query('INSERT INTO smart_tourist_audit_logs (id, data) VALUES ($1, $2::jsonb)', [auditId, JSON.stringify(audit)]);
      console.log(`Created audit log for review ${review.id}`);
      count++;
    }
  }
  
  console.log(`Successfully synced ${count} missing review audits.`);
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
