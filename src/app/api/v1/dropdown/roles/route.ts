import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch roles
        const roles = db.prepare(`
            SELECT distinct role as id,
                            role as name
            FROM employees 
            ORDER BY role ASC
        `).all();

        return NextResponse.json({ roles }, { status: 200 });
    } catch (error) {
        console.error('Error fetching dropdown roles:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve roles' },
            { status: 500 }
        );
    }
}
