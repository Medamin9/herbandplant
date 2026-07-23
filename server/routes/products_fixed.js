// FIXED VERSION - Lines 84-120 only
// Copy this into products.js starting at line 84

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(parseInt(category_id));
      paramIndex++;
    }

    if (subcategory_id) {
      query += ` AND p.subcategory_id = $${paramIndex}`;
      params.push(parseInt(subcategory_id));
      paramIndex++;
    }

    if (min_price) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    if (promotion === 'true') {
      query += ` AND p.promotion > 0`;
    }

    if (new_product === 'true') {
      query += ` AND p.new_product = true`;
    }

    if (top_vente === 'true') {
      query += ` AND p.top_vente = true`;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total products for pagination
    const countQuery = query.replace(
      'SELECT p.*, c.name as category_name, s.name as subcategory_name',
      'SELECT COUNT(*) as total'
    );
    const countResult = await db.query(countQuery, params);
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / limit);

    // Custom ordering logic
    query += `
      ORDER BY 
        CASE 
          WHEN p.promotion > 0 THEN 1
          WHEN p.new_product = true THEN 2
          WHEN p.stock_repture = true THEN 4
          ELSE 3
        END,
        p.created_at DESC
    `;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await db.query(query, params);
