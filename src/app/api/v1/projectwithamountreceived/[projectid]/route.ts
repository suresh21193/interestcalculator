import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

// Update a Project and its AmountReceived
export async function PUT(req: NextRequest, {params}: { params: { projectid: number } }) {
    try {
        const body = await req.json();
        const projectId = params.projectid;

        console.log("Received PUT request for project:", projectId);
        console.log("Payload:", JSON.stringify(body, null, 2));

        /*if (!projectId || !Array.isArray(body)) {
            return NextResponse.json({error: "Missing required fields"}, {status: 400});
        }*/

        // Check if the project exists
        const checkProjectStmt = db.prepare(`SELECT projectid
                                            FROM projects
                                            WHERE projectid = ?`);
        const projectExists = checkProjectStmt.get(projectId);
        if (!projectExists) {
            console.log("Project does not exist:", projectId);
            return NextResponse.json({error: "Project not found"}, {status: 404});
        }

        console.log("Project exists. Proceeding with update...");

        const deleteProjectAmountReceivedStmt = db.prepare(`
            DELETE
            FROM amountreceived
            WHERE projectid = ?
        `);
        const insertProjectAmountReceivedStmt = db.prepare(`
            INSERT INTO amountreceived (projectid, amountreceived, dateofamountreceived, remarks)
            VALUES ( ?, ?, ?, ?);
        `);

        const transaction = db.transaction(() => {

            console.log("Deleting existing project amountreceived...");
            deleteProjectAmountReceivedStmt.run(projectId);

            console.log("Inserting new amountreceived...");
            body.amountreceived.forEach((amountreceived: { amountreceived:number; dateofamountreceived: string; remarks: string }) => {
                //console.log(`Inserting expense: ${expense.expensename}, Amount: ${expense.amount}`);
                //formatting the date
                //console.log("amountreceived dateofamountreceived:", amountreceived.dateofamountreceived)
                const date = new Date(amountreceived.dateofamountreceived);
                const isoDate = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');

                console.log("date:", date)
                console.log("Inserting amountreceived with isoDate:", isoDate);

                insertProjectAmountReceivedStmt.run(projectId, amountreceived.amountreceived, amountreceived.dateofamountreceived, amountreceived.remarks);
            });
        });

        transaction();

        //console.log("Project updated successfully.");

        return NextResponse.json({message: "Project updated successfully"}, {status: 200});
    } catch (error) {
        console.error("Error updating Project:", error);
        return NextResponse.json({error: "Failed to update Project"}, {status: 500});
    }
}
