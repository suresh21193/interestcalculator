import {NextRequest, NextResponse} from 'next/server';
import db from '@/lib/db';

// Update an Employee and its Petty cash
export async function PUT(req: NextRequest, {params}: { params: { empid: number } }) {
    try {
        const body = await req.json();
        const empid = params.empid;

        console.log("Received PUT request for employee:", empid);
        console.log("Payload:", JSON.stringify(body, null, 2));

        /*if (!projectId || !Array.isArray(body)) {
            return NextResponse.json({error: "Missing required fields"}, {status: 400});
        }*/

        // Check if the employee exists
        const checkEmployeeStmt = db.prepare(`SELECT empid
                                            FROM employees
                                            WHERE empid = ?`);
        const empExists = checkEmployeeStmt.get(empid);
        if (!empExists) {
            console.log("Project does not exist:", empid);
            return NextResponse.json({error: "Project not found"}, {status: 404});
        }

        console.log("Employee exists. Proceeding with update...");

        /*const updateRecipeStmt = db.prepare(`
            UPDATE recipes
            SET name    = ?,
                percent = ?,
                package_cost = ?,
                miscellaneous_cost = ?,
                notes = ?
            WHERE id = ?
        `);*/
        const deleteEmployeePettycashStmt = db.prepare(`
            DELETE
            FROM pettycash
            WHERE empid = ?
        `);
        const insertEmployeePettycashStmt = db.prepare(`
            INSERT INTO pettycash (empid, pettycash, dateofpettycash)
            VALUES (?, ?, ?);
        `);

        const transaction = db.transaction(() => {
            /*console.log("Updating recipe...");
            updateRecipeStmt.run(body.name, body.percent, body.package_cost, body.miscellaneous_cost, body.notes, recipeId);
*/
            console.log("Deleting existing employee pettycash...");
            deleteEmployeePettycashStmt.run(empid);

            console.log("Inserting new pettycash...");
            body.pettycashes.forEach((pettycash: { pettycash:number; dateofpettycash: string }) => {
                console.log(`Inserting expense: ${pettycash.pettycash}, Amount: ${pettycash.dateofpettycash}`);
                insertEmployeePettycashStmt.run(empid, pettycash.pettycash, pettycash.dateofpettycash);
            });
        });

        transaction();

        console.log("Employee updated successfully.");

        return NextResponse.json({message: "Employee updated successfully"}, {status: 200});
    } catch (error) {
        console.error("Error updating Employee:", error);
        return NextResponse.json({error: "Failed to update Employee"}, {status: 500});
    }
}
