import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch locations with only id and location
        const locations = db.prepare(`
            SELECT distinct location as id,
                   location as name
            FROM projects 
            ORDER BY location ASC
        `).all();

        return NextResponse.json({ locations }, { status: 200 });
    } catch (error) {
        console.error('Error fetching dropdown locations:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve locations' },
            { status: 500 }
        );
    }
}
