import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch employees with only id, name
        const employees = db.prepare(`
            SELECT distinct 
                empid as empid,
                name as employeename
            FROM employees where status='Active' order by employeename asc;
        `).all();

        return NextResponse.json({ employees }, { status: 200 });
    } catch (error) {
        console.error('Error fetching dropdown employees:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve employees' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log(body);

        if (!body.name || !body.role  ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert into SQLite database
        const stmt = db.prepare(`
      INSERT INTO employees (name, role) VALUES (?, ?)
    `);
        stmt.run(body.name, body.role);

        return NextResponse.json(
            {
                message: 'Employee created successfully',
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
