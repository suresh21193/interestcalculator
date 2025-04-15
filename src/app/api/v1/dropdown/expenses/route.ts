import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch ingredients with only id and name
        const expenses = db.prepare(`
            SELECT expenseid, expensename 
            FROM projectexpenses 
            ORDER BY expensename ASC
        `).all();

        return NextResponse.json({ expenses }, { status: 200 });
    } catch (error) {
        console.error('Error fetching dropdown expenses:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve expenses' },
            { status: 500 }
        );
    }
}
