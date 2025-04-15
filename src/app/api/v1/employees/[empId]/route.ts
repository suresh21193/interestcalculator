import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function getEmpId(params: { empId?: number }) {
    await Promise.resolve()
    if (!params || !params.empId) {
        return null;
    }
    return params.empId;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { empId?: number } }
) {

    const empId = await getEmpId(params);

    if(!empId){
        return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    // Fetch employees with only id, name and cash
    const employees = db.prepare(`
        SELECT
            e.empid as empid,
            e.name as name,
            ec.totalamountgiven as totalamountgiven,
            IFNULL(SUM(pe.amount), 0) AS expensespent,
            (ec.totalamountgiven - IFNULL(SUM(pe.amount), 0)) AS calculatedbalance
        FROM employees e
                 JOIN employeeextracash ec ON e.empid = ec.empid
                 LEFT JOIN projectexpenses pe ON e.empid = pe.empid
        GROUP BY e.empid, e.name, ec.totalamountgiven;
    `).all();

    return NextResponse.json({ employees }, { status: 200 });

}

export async function PUT(
    req: NextRequest,
    { params }: { params: { empId?: number } }
) {
    try {
        const empId = await getEmpId(params);

        if(!empId){
            return NextResponse.json({ error: 'Invalid1 employee ID' }, { status: 400 });
        }

        // Check if employee exists
        const checkStmt = db.prepare('SELECT empid FROM employees WHERE empid = ?');
        const existingEmpId = checkStmt.get(empId);

        if (!existingEmpId) {
            return NextResponse.json({ error: 'employee not found' }, { status: 404 });
        }

        // Parse request body
        const data = await req.json();
        const { name, role } = data;

        // Validate required fields
        if (!name || role === undefined ) {
            return NextResponse.json({
                error: 'Missing required fields. name, role'
            }, { status: 400 });
        }

        // Update the ingredient
        const updateStmt = db.prepare(
            'UPDATE employees SET name=?, role=? WHERE empid = ?'
        );

        updateStmt.run(name, role, empId);

        // Get the updated employee
        const getStmt = db.prepare('SELECT * FROM employees WHERE empid = ?');
        const updatedEmpId = getStmt.get(empId);

        return NextResponse.json({
            message: 'updated successfully',
            employee: updatedEmpId
        });
    } catch (error) {
        console.log("suresh7");
        console.error('Error updating employee:', error);
        return NextResponse.json(
            { error: 'Failed to update employee' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { empId?: number } }
) {
    try {
        const empId = await getEmpId(params);

        if(!empId){
            return NextResponse.json({ error: 'Invalid empId ' }, { status: 400 });
        }

        // Check if employee exists
        const checkStmt = db.prepare('SELECT empid FROM employees WHERE empid = ?');
        const existingEmpId = checkStmt.get(empId);

        if (!existingEmpId) {
            return NextResponse.json({ error: 'employee not found' }, { status: 404 });
        }

        // Delete the ingredient
        const deleteStmt = db.prepare('DELETE FROM employees WHERE empid = ?');
        deleteStmt.run(empId);

        return NextResponse.json({
            message: 'Employee deleted successfully',
            deletedId: empId
        });
    } catch (error) {
        console.error('Error deleting Employee:', error);
        return NextResponse.json(
            { error: 'Failed to delete Employee' },
            { status: 500 }
        );
    }
}