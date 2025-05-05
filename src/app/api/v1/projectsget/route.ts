import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Get query parameters for pagination and search
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search') || '';
        const employeeIds = searchParams.get('employeeIds');
        const locationIds = searchParams.get('locationIds');
        const typeIds = searchParams.get('typeIds');

        const offset = (page - 1) * limit;
        const conditions = [];
        /*const values: string[] = [];*/
        const values: (string | null)[] = [];

        if (search) {
            conditions.push(`p.projectname LIKE ?`);
            values.push(`%${search}%`);
        }

        console.log("params:", employeeIds);
        if (employeeIds) {
            /*const employeeList = employeeIds.split(',');
            const employeeList = employeeIds.split(',').map(id => id === '' ? null : id);
            conditions.push(`pe.empid IN (
                SELECT DISTINCT pem.empid FROM projectexpenses pem
                WHERE pem.empid IN (${employeeList.map(() => '?').join(',')})
            )`);
            values.push(...employeeList);*/
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

// Then:
            console.log("empidCondition:", empidCondition);
            if (empidCondition) {
                /*conditions.push(`pe.empid IN (
                SELECT DISTINCT pem.empid FROM projectexpenses pem
                WHERE ${empidCondition}
            )`);*/
                conditions.push(`(${empidCondition.replace(/pem\.empid/g, 'pe.empid')})`);
                values.push(...filteredEmployeeList);
            }
        }

        if (locationIds) {
            const locationList = locationIds.split(',');
            conditions.push(`p.location IN (
                SELECT DISTINCT pr.location FROM projects pr 
                WHERE pr.location IN (${locationList.map(() => '?').join(',')})
            )`);
            values.push(...locationList);
        }

        if (typeIds) {
            const typeList = typeIds.split(',');
            conditions.push(`pe.type IN (
                SELECT DISTINCT pt.type FROM projectexpenses pt 
                WHERE pt.type IN (${typeList.map(() => '?').join(',')})
            )`);
            values.push(...typeList);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        console.log("whereClause:", whereClause);

        const countQuery = `
            SELECT COUNT(DISTINCT p.projectid) as total
            FROM projects p
                 LEFT JOIN projectexpenses pe ON p.projectid = pe.projectid
                ${whereClause}
        `;

        const countStmt = db.prepare(countQuery);
        //console.log(countStmt);
        const countResult = countStmt.get(...values);
        const total = countResult?.total || 0;


        const query = `SELECT
                           p.projectid,
                           p.projectname,
                           p.location,
                           p.description,
                           p.projectcost,
                           IFNULL(ar.amountreceived, 0)                   AS income,
                           (p.projectcost - IFNULL(ar.amountreceived, 0)) AS pendingamount,
                           COALESCE(SUM(pe.amount), 0) AS totalexpense,
                           (p.projectcost - COALESCE(SUM(pe.amount), 0)) AS projectbalance
                       FROM projects p
                                LEFT JOIN projectexpenses pe ON p.projectid = pe.projectid
                                LEFT JOIN (SELECT projectid, SUM(amountreceived) AS amountreceived
                                           FROM amountreceived
                                           GROUP BY projectid) ar ON p.projectid = ar.projectid
                           ${whereClause}
                       GROUP BY p.projectid, p.projectname, p.location, p.projectcost, p.description
                       ORDER BY p.projectname asc LIMIT ?
                       OFFSET ?`;
        const stmt = db.prepare(query);
        const projects = stmt.all(...values, limit, offset);
        //console.log("stmt:", stmt);

        //applying filters to child
        // const employeeList = employeeIds ? employeeIds.split(',') : [];
        // const employeeList = employeeIds.split(',').map(id => id === '' ? null : id);
        const typeList = typeIds ? typeIds.split(',') : [];

        const projectsWithExpenses = projects.map((project: { projectid: number; projectname: string; location: string; description: string; projectcost: number; income: number; totalexpense: number; pendingamount: number; projectbalance: number }) => {
            let expenseQuery = `
                SELECT expenseid,
                       expensename,
                       empid,
                       amount,
                       type,
                       dateofexpense,
                       remarks
                FROM projectexpenses
                WHERE projectid = ?
            `;
            const expenseValues: (string | number)[] = [project.projectid];

            /*if (employeeList.length > 0) {
                expenseQuery += ` AND empid IN (${employeeList.map(() => '?').join(',')})`;
                expenseValues.push(...employeeList);
            }*/
            //code to filter null
            /*const employeeList = employeeIds
                ? employeeIds.split(',').map(id => id === '' ? null : id)
                : [];*/
            console.log("employeeIds child filter:", employeeIds);
            const employeeListRaw = (employeeIds && employeeIds.trim() !== '') ? employeeIds.split(',') : [];
            const employeeList = employeeListRaw.map(id => id === 'null' ? null : id);
            console.log("employeeListRaw child filter:", employeeListRaw);
            console.log("employeeList child filter:", employeeList);

            const hasNull = employeeList.includes(null);
            console.log("hasNull child filter:", hasNull);
            const validEmployeeIds = employeeList.filter(id => id !== null);
            console.log("validEmployeeIds child filter:", validEmployeeIds);
            console.log("employeeList.length child filter:", employeeList.length);
            console.log("validEmployeeIds.length child filter:", validEmployeeIds.length);

            if (employeeList.length > 0) {
                if (validEmployeeIds.length > 0) {
                    expenseQuery += ` AND (empid IN (${validEmployeeIds.map(() => '?').join(',')})`;
                    expenseValues.push(...validEmployeeIds);

                    if (hasNull) {
                        expenseQuery += ` OR empid IS NULL)`;
                    } else {
                        expenseQuery += `)`;
                    }
                } else {
                    // only nulls
                    expenseQuery += ` AND empid IS NULL`;
                }
            }
            console.log("typeList child filter:", typeList);
            if (typeList.length > 0) {
                expenseQuery += ` AND type IN (${typeList.map(() => '?').join(',')})`;
                expenseValues.push(...typeList);
            }
            expenseQuery += `order by dateofexpense asc`;
            console.log("expenseQuery:", expenseQuery);
            const expenses = db.prepare(expenseQuery).all(...expenseValues);
            console.log("expenseQuery child filter:", expenseQuery);
            console.log("expenses child filter:", expenses);
            // commented
            /*const expenses = db.prepare(`
                SELECT expenseid,
                       expensename,
                       empid,
                       amount,
                       type,
                       dateofexpense,
                       remarks
                FROM projectexpenses
                WHERE projectid = ?
            `).all(project.projectid);*/

            const amountreceived = db.prepare(`
                SELECT amountreceivedid,
                       projectid,
                       amountreceived,
                       dateofamountreceived,
                       remarks
                FROM amountreceived
                WHERE projectid = ?
                ORDER BY dateofamountreceived ASC, amountreceivedid
            `).all(project.projectid);
            console.log("amountreceived",amountreceived);
            console.log("projectid",project.projectid);
            return {
                ...project,
                expenses,
                amountreceived
            };
        });
        console.log("projectsWithExpenses",projectsWithExpenses);
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
        console.error('Error fetching projectsWithExpenses:', error);
        return NextResponse.json({ error: 'Failed to retrieve projectsWithExpenses' }, { status: 500 });
    }
}