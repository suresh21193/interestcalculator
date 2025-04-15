import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Get query parameters for pagination and search
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;
        const conditions = [];
        const values: string[] = [];

        if (search) {
            conditions.push(`e.name LIKE ?`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(DISTINCT e.empid) as total
            FROM employees e
                ${whereClause}
        `;

        const countStmt = db.prepare(countQuery);
        const countResult = countStmt.get(...values);
        const total = countResult?.total || 0;

        const dataQuery = `SELECT
                               e.empid AS empid,
                               e.name AS name,
                               e.role AS role,
                               IFNULL(pc.total_pettycash, 0) AS pettycashtotal,
                               IFNULL(pe.total_expense, 0) AS expensespent,
                               (IFNULL(pc.total_pettycash, 0) - IFNULL(pe.total_expense, 0)) AS calculatedbalance
                           FROM
                               employees e
                                   LEFT JOIN (
                                   SELECT empid, SUM(pettycash) AS total_pettycash
                                   FROM pettycash
                                   GROUP BY empid
                               ) pc ON e.empid = pc.empid
                                   LEFT JOIN (
                                   SELECT empid, SUM(amount) AS total_expense
                                   FROM projectexpenses
                                   GROUP BY empid
                               ) pe ON e.empid = pe.empid
                           ORDER BY
                               e.empid  
                       asc LIMIT ?
                       OFFSET ?`;

        const stmt = db.prepare(dataQuery);
        const employees = stmt.all(...values, limit, offset);

        const employeesWithPettycash = employees.map((employee: { empid: number; name: string; role: string; pettycashtotal: number; expensespent: number; calculatedbalance: number }) => {
            const pettycash = db.prepare(`
                SELECT pettycashid,
                       empid,
                       pettycash,
                       dateofpettycash
                FROM pettycash
                WHERE empid = ?
            `).all(employee.empid);
            return {
                ...employee,
                pettycash
            };
        });

        return NextResponse.json({
            employees: employeesWithPettycash,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
            search: search || null,
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to retrieve pettycash' }, { status: 500 });
    }
}