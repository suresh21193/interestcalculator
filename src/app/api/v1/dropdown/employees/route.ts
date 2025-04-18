import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch employees with only id and name
        const employees = db.prepare(`
            SELECT empid as id, 
                   name 
            FROM employees 
            ORDER BY name ASC
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
