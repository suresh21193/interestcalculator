import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Get query parameters for pagination and search
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        // Calculate offset
        const offset = (page - 1) * limit;

        // Prepare search condition
        const searchCondition = search ? `WHERE expensename LIKE ?` : '';
        const searchValue = search ? `%${search}%` : '';

        // Get total count with search condition
        const countQuery = `SELECT COUNT(*) as total
                            FROM projectexpenses ${searchCondition}`;
        const countStmt = db.prepare(countQuery);

        // Execute count query with or without search parameter
        const countResult = search
            ? countStmt.get(searchValue) as { total: number }
            : countStmt.get() as { total: number };

        const total = countResult.total;

        // Query ingredients with pagination and search
        const query = `SELECT
                           p.projectname,
                           e.name as employeename,
                           pe.*
                       FROM projectexpenses pe
                                LEFT JOIN projects p ON pe.projectid = p.projectid
                                LEFT JOIN employees e ON pe.empid = e.empid
                           ${searchCondition}
                           ORDER BY projectname asc LIMIT ?
                           OFFSET ?`;
        const stmt = db.prepare(query);

        // Execute main query with appropriate parameters
        const expenses = search
            ? stmt.all(searchValue, limit, offset)
            : stmt.all(limit, offset);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Return the JSON response with pagination metadata
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
            {error: 'Failed to retrieve expenses'},
            {status: 500}
        );
    }
}