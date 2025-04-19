import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch projects
        const expenses = db.prepare(`
            select officeexpenseid,  name, cost, dateofexpense, remarks from officeexpenses;
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

        if (!body.name || !body.cost || !body.dateofexpense ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        // Insert into SQLite database
        const stmt = db.prepare(`
            INSERT INTO officeexpenses (name, cost, dateofexpense, remarks) VALUES ( ?, ?, ?, ?)
    `);
        //date
        const date = new Date(body.dateofexpense);
        const isoDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        console.log(body.dateofexpense);
        console.log(isoDate);
        stmt.run(body.name, body.cost, isoDate, body.remarks);

        return NextResponse.json(
            {
                message: 'office expense Added successfully',
                expense: { ...body },
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