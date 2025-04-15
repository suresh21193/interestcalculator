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
            conditions.push(`p.projectname LIKE ?`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(DISTINCT p.projectid) as total
            FROM projects p
                ${whereClause}
        `;

        const countStmt = db.prepare(countQuery);
        const countResult = countStmt.get(...values);
        const total = countResult?.total || 0;


        const query = `SELECT
                           p.projectid,
                           p.projectname,
                           p.location,
                           p.description,
                           p.projectcost,
                           p.income,
                           (p.projectcost - p.income) AS pendingamount,
                           COALESCE(SUM(pe.amount), 0) AS totalexpense,
                           (p.projectcost - COALESCE(SUM(pe.amount), 0)) AS projectbalance
                       FROM projects p
                                LEFT JOIN projectexpenses pe ON p.projectid = pe.projectid
                           ${whereClause}
                       GROUP BY p.projectid, p.projectname, p.location, p.projectcost, p.description, p.income
                       ORDER BY p.projectname asc LIMIT ?
                       OFFSET ?`;
        const stmt = db.prepare(query);
        const projects = stmt.all(...values, limit, offset);

        const projectsWithExpenses = projects.map((project: { projectid: number; projectname: string; location: string; description: string; projectcost: number; income: number; totalexpense: number; pendingamount: number; projectbalance: number }) => {
            const expenses = db.prepare(`
                SELECT expenseid,
                       expensename,
                       empid,
                       amount,
                       type,
                       dateofexpense,
                       remarks
                FROM projectexpenses
                WHERE projectid = ?
            `).all(project.projectid);
            return {
                ...project,
                expenses
            };
        });

        return NextResponse.json({
            projects: projectsWithExpenses,
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
        console.error('Error fetching recipes:', error);
        return NextResponse.json({ error: 'Failed to retrieve expenses' }, { status: 500 });
    }
}