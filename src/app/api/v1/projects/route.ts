import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch projects
        const projects = db.prepare(`
            select projectid, projectname from projects;
        `).all();

        return NextResponse.json({ projects }, { status: 200 });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve projects' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log(body);

        if (!body.projectname || !body.location || !body.projectcost ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        // Insert into SQLite database
        const stmt = db.prepare(`
      INSERT INTO projects (projectname, location, projectcost, description, income) VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(body.projectname, body.location, body.projectcost, body.description, body.income);

        return NextResponse.json(
            {
                message: 'Project Added successfully',
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
