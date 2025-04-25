import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch employees with only id and name
        const employees = db.prepare(`
            SELECT DISTINCT e.empid as id,
                            COALESCE(e.name, 'Others') AS name
            FROM employees e
                     RIGHT OUTER JOIN projectexpenses pe ON e.empid = pe.empid 
            ORDER BY e.name ASC
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
