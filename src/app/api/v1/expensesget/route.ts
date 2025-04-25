import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Get query parameters for pagination, search and employeeIds filter
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const employeeIds = searchParams.get('employeeIds');
        const typeIds = searchParams.get('typeIds');

        // ✅ NEW: Get date range filters from query params
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Initialize conditions and parameter values arrays
        const conditions: string[] = [];
        const params: string[] = [];

        // Add condition for search text if provided
        if (search) {
            conditions.push(`pe.expensename LIKE ?`);
            params.push(`%${search}%`);
        }

        // Add condition for filtering by employee IDs if provided
        /*if (employeeIds) {
            const employeeList = employeeIds.split(',');
            conditions.push(`pe.empid IN (
                SELECT DISTINCT pem.empid FROM projectexpenses pem 
                WHERE pem.empid IN (${employeeList.map(() => '?').join(',')})
            )`);
            params.push(...employeeList);
        }*/
        if (employeeIds) {
            const employeeListRaw = employeeIds?.split(',') || [];
            const employeeList = employeeListRaw.map(id => id === 'null' ? null : id);
            //const employeeList = employeeIds.split(',').map(id => id === '' ? null : id);
            console.log("splited:", employeeList);
            const hasNull = employeeList.includes(null);
            const filteredEmployeeList = employeeList.filter(id => id !== null);

            let empidCondition = '';

            if (filteredEmployeeList.length > 0 && hasNull) {
                empidCondition = `(pem.empid IN (${filteredEmployeeList.map(() => '?').join(',')}) OR pem.empid IS NULL)`;
            } else if (filteredEmployeeList.length > 0) {
                empidCondition = `pem.empid IN (${filteredEmployeeList.map(() => '?').join(',')})`;
            } else if (hasNull) {
                empidCondition = `pem.empid IS NULL`;
            }

            console.log("empidCondition:", empidCondition);
            if (empidCondition) {
                conditions.push(`(${empidCondition.replace(/pem\.empid/g, 'pe.empid')})`);
                params.push(...filteredEmployeeList);
            }
        }

        // Add condition for filtering by type IDs if provided
        if (typeIds) {
            const typeList = typeIds.split(',');
            conditions.push(`pe.type IN (
                SELECT DISTINCT pt.type FROM projectexpenses pt 
                WHERE pt.type IN (${typeList.map(() => '?').join(',')})
            )`);
            params.push(...typeList);
        }

        //datefilter condition
        if (startDate && endDate) {
            conditions.push(`DATE(pe.dateofexpense) BETWEEN DATE(?) AND DATE(?)`);
            //conditions.push(`pe.dateofexpense BETWEEN ? AND ?`);
            params.push(startDate, endDate);
        }

        // Combine conditions into a WHERE clause if any exist
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count query for pagination metadata
        const countQuery = `
            SELECT COUNT(*) as total
            FROM projectexpenses pe
            ${whereClause}
        `;
        const countStmt = db.prepare(countQuery);
        const countResult = params.length > 0
            ? countStmt.get(...params) as { total: number }
            : countStmt.get() as { total: number };

        const total = countResult.total;

        // Main query with joins, filtering, and pagination
        const query = `
            SELECT
                p.projectname,
                e.name as employeename,
                pe.*
            FROM projectexpenses pe
                     LEFT JOIN projects p ON pe.projectid = p.projectid
                     LEFT JOIN employees e ON pe.empid = e.empid
                ${whereClause}
            ORDER BY pe.dateofexpense ASC, pe.expenseid
                LIMIT ?
            OFFSET ?;
        `;
        const stmt = db.prepare(query);

        // Execute main query using dynamic params followed by limit and offset
        const expenses = params.length > 0
            ? stmt.all(...params, limit, offset)
            : stmt.all(limit, offset);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Return the JSON response with the result and pagination metadata
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
