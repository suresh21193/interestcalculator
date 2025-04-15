import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function getProjectId(params: { projectId?: number }) {
    await Promise.resolve()
    if (!params || !params.projectId) {
        return null;
    }
    return params.projectId;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { projectId?: number } }
) {

    const projectId = await getProjectId(params);

    if(!projectId){
        return NextResponse.json({ error: 'Invalid project Id ' }, { status: 400 });
    }
    // Fetch employees with only id, name and cash
    const projects = db.prepare(`
        select projectid, expensename, amount, type from projectexpenses
        where projectid = ${params.projectId};
           ;
    `).all();

    return NextResponse.json({ projects }, { status: 200 });

}

export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId?: number } }
) {
    try {
        const projectId = await getProjectId(params);

        if(!projectId){
            return NextResponse.json({ error: 'Invalid1 project Id' }, { status: 400 });
        }

        // Check if project exists
        const checkStmt = db.prepare('SELECT projectid FROM projects WHERE projectid = ?');
        const existingProjectId = checkStmt.get(projectId);

        if (!existingProjectId) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Parse request body
        const data = await req.json();
        const { projectname, location, projectcost, description, income } = data;

        // Validate required fields
        if (!projectname || location === undefined || !projectcost  === undefined ) {
            return NextResponse.json({
                error: 'Missing required fields. projectname, location, projectcost is required.'
            }, { status: 400 });
        }

        // Update the ingredient
        const updateStmt = db.prepare(
            'UPDATE projects SET projectname=?, location=?, projectcost = ?, description=?, income = ? WHERE projectid = ?'
        );

        updateStmt.run(projectname, location, projectcost, description, income, projectId);

        // Get the updated employee
        const getStmt = db.prepare('SELECT * FROM projects WHERE projectid = ?');
        const updatedProjectId = getStmt.get(projectId);

        return NextResponse.json({
            message: 'updated successfully',
            employee: updatedProjectId
        });
    } catch (error) {
        console.error('Error updating Project:', error);
        return NextResponse.json(
            { error: 'Failed to update Project' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId?: number } }
) {
    try {
        const projectId = await getProjectId(params);

        if(!projectId){
            return NextResponse.json({ error: 'Invalid1 project Id' }, { status: 400 });
        }

        // Check if project exists
        const checkStmt = db.prepare('SELECT projectid FROM projects WHERE projectid = ?');
        const existingProjectId = checkStmt.get(projectId);

        if (!existingProjectId) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Delete the project
        const deleteStmt = db.prepare('DELETE FROM projects WHERE projectid = ?');
        deleteStmt.run(projectId);

        return NextResponse.json({
            message: 'project deleted successfully',
            deletedId: projectId
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}

