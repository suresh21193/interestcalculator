import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch types
        const types = db.prepare(`
            SELECT distinct type as id,
                            type as name
            FROM projectexpenses 
            ORDER BY type ASC
        `).all();

        return NextResponse.json({ types }, { status: 200 });
    } catch (error) {
        console.error('Error fetching dropdown types:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve types' },
            { status: 500 }
        );
    }
}
