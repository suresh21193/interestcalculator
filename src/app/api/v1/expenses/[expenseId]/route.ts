import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function getExpenseId(params: { expenseId?: number }) {
    await Promise.resolve()
    if (!params || !params.expenseId) {
        return null;
    }
    return params.expenseId;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { expenseId?: number } }
) {

    const expenseId = await getExpenseId(params);

    if(!expenseId){
        return NextResponse.json({ error: 'Invalid expense Id ' }, { status: 400 });
    }
    // Fetch expense
    const expenses = db.prepare(`
        SELECT
            p.projectname,
            e.name as employeename,
            pe.*
        FROM projectexpenses pe
                 LEFT JOIN projects p ON pe.projectid = p.projectid
                 LEFT JOIN employees e ON pe.empid = e.empid
        where expenseid = ${params.expenseId};
           ;
    `).all();

    return NextResponse.json({ expenses }, { status: 200 });

}

export async function PUT(
    req: NextRequest,
    { params }: { params: { expenseId?: number } }
) {
    try {
        const expenseId = await getExpenseId(params);

        if(!expenseId){
            return NextResponse.json({ error: 'Invalid1 expense Id' }, { status: 400 });
        }

        // Check if expense exists
        const checkStmt = db.prepare('SELECT expenseid FROM projectexpenses WHERE expenseid = ?');
        const existingExpenseId = checkStmt.get(expenseId);

        if (!existingExpenseId) {
            return NextResponse.json({ error: 'expense not found' }, { status: 404 });
        }

        // Parse request body
        const data = await req.json();
        const { projectid, empid, expensename, amount, type, dateofexpense, remarks } = data;

        // Validate required fields
        if (!expensename || amount === undefined || !type || dateofexpense === undefined ) {
            return NextResponse.json({
                error: 'Missing required fields. expensename, amount, type, dateofexpense is required.'
            }, { status: 400 });
        }

        // Update the ingredient
        const updateStmt = db.prepare(
            'UPDATE projectexpenses SET projectid=?, empid=?, expensename = ?, amount=?, type = ?, dateofexpense = ?, remarks=? WHERE expenseid = ?'
        );

        updateStmt.run(projectid, empid, expensename, amount, type, dateofexpense, remarks, expenseId);

        // Get the updated employee
        const getStmt = db.prepare('SELECT * FROM projectexpenses WHERE expenseid = ?');
        const updatedExpenseId = getStmt.get(expenseId);

        return NextResponse.json({
            message: 'updated successfully',
            employee: updatedExpenseId
        });
    } catch (error) {
        console.error('Error updating Expense:', error);
        return NextResponse.json(
            { error: 'Failed to update Expense' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { expenseId?: number } }
) {
    try {
        const expenseId = await getExpenseId(params);

        if(!expenseId){
            return NextResponse.json({ error: 'Invalid1 expense Id' }, { status: 400 });
        }

        // Check if expense exists
        const checkStmt = db.prepare('SELECT expenseid FROM projectexpenses WHERE expenseid = ?');
        const existingExpenseId = checkStmt.get(expenseId);

        if (!existingExpenseId) {
            return NextResponse.json({ error: 'expense not found' }, { status: 404 });
        }

        // Delete the project
        const deleteStmt = db.prepare('DELETE FROM projectexpenses WHERE expenseid = ?');
        deleteStmt.run(expenseId);

        return NextResponse.json({
            message: 'expense deleted successfully',
            deletedId: expenseId
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        );
    }
}

