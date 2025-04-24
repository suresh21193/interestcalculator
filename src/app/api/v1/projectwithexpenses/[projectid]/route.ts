import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

// Update a Project and its Expense
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

        /*const updateRecipeStmt = db.prepare(`
            UPDATE recipes
            SET name    = ?,
                percent = ?,
                package_cost = ?,
                miscellaneous_cost = ?,
                notes = ?
            WHERE id = ?
        `);*/
        const deleteProjectExpensesStmt = db.prepare(`
            DELETE
            FROM projectexpenses
            WHERE projectid = ?
        `);
        const insertProjectExpenseStmt = db.prepare(`
            INSERT INTO projectexpenses (projectid, expensename, empid, amount, type, dateofexpense, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        const transaction = db.transaction(() => {
            /*console.log("Updating recipe...");
            updateRecipeStmt.run(body.name, body.percent, body.package_cost, body.miscellaneous_cost, body.notes, recipeId);
*/
            console.log("Deleting existing project expenses...");
            deleteProjectExpensesStmt.run(projectId);

            console.log("Inserting new expenses...");
            body.expenses.forEach((expense: { expensename: string; empid:number; amount: number; type: string; dateofexpense: string; remarks: string }) => {
                //console.log(`Inserting expense: ${expense.expensename}, Amount: ${expense.amount}`);
                //formatting the date
                console.log("expense dateofexpense:", expense.dateofexpense)
                const date = new Date(expense.dateofexpense);
                const isoDate = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');

                console.log("Inserting expense with projectId:", projectId, "and empid:", expense.empid);
                console.log("date:", date)
                console.log("Inserting expense with isoDate:", isoDate);
                console.log("empid: ", expense.empid);


                insertProjectExpenseStmt.run(projectId, expense.expensename, expense.empid, expense.amount, expense.type, isoDate, expense.remarks);
            });
        });

        transaction();

        console.log("Project updated successfully.");

        return NextResponse.json({message: "Project updated successfully"}, {status: 200});
    } catch (error) {
        console.error("Error updating Project:", error);
        return NextResponse.json({error: "Failed to update Project"}, {status: 500});
    }
}
