import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch projects
        const expenses = db.prepare(`
            select expenseid, projectid, empid, expensename,amount,type, dateofexpense, remarks from projectexpenses;
        `).all();

        return NextResponse.json({ expenses }, { status: 200 });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve expenses' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log(body);

        if (!body.expensename || !body.amount || !body.type || !body.dateofexpense ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        // Insert into SQLite database
        const stmt = db.prepare(`
            INSERT INTO projectexpenses (projectid, empid, expensename, amount, type, dateofexpense, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        //dateformat change
        // const isoDate = new Date(body.dateofexpense).toISOString().split('T')[0];
        const date = new Date(body.dateofexpense);
        const isoDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        stmt.run(body.projectid, body.empid, body.expensename, body.amount, body.type, isoDate, body.remarks);

        return NextResponse.json(
            {
                message: 'expense Added successfully',
                employee: { ...body },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Invalid JSON format' },
            { status: 400 }
        );
    }
}