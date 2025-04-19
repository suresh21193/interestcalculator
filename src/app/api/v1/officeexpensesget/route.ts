import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        // ✅ NEW: Get date range filters from query params
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const offset = (page - 1) * limit;

        // ✅ NEW: Build dynamic WHERE conditions
        const conditions: string[] = [];
        const values: any[] = [];

        if (search) {
            conditions.push(`name LIKE ?`);
            values.push(`%${search}%`);
        }

        if (startDate && endDate) {
            conditions.push(`DATE(dateofexpense) BETWEEN DATE(?) AND DATE(?)`);
            values.push(startDate, endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 🛠 MODIFIED: Use dynamic whereClause in count query
        const countQuery = `SELECT COUNT(*) as total FROM officeexpenses ${whereClause}`;
        const countStmt = db.prepare(countQuery);
        const countResult = countStmt.get(...values) as { total: number };

        const total = countResult.total;

        // 🛠 MODIFIED: Use same whereClause and values in data query
        const query = `SELECT
                           officeexpenseid,
                           name,
                           cost,
                           dateofexpense,
                           remarks
                       FROM officeexpenses
                       ${whereClause}
                       ORDER BY officeexpenseid ASC
                       LIMIT ? OFFSET ?`;

        const stmt = db.prepare(query);
        console.log(query);
        console.log(values);
        const expenses = stmt.all(...values, limit, offset);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return NextResponse.json({
            expenses,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNext,
                hasPrev
            },
            search: search || null
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve expenses' },
            { status: 500 }
        );
    }
}