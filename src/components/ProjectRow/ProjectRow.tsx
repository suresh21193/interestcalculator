import React, { useState, useEffect  } from "react";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import { Input } from "@headlessui/react";
import toast from "react-hot-toast";
import {ProjectWithExpensesResponse} from "@/types/types";
import axios from "axios";
import DatePicker from "react-datepicker";

interface Project {
    projectid: number;
    projectname: string;
    location: string;
    projectcost: number;
    description: string;
    income: number;
    totalexpense: number;
    pendingamount: number;
    projectbalance: number;
}

// 🆕 Expense type
interface Expense {
    expenseid: number;
    projectid: number | null;
    empid: number | null;
    projectname: string;
    employeename: string;
    expensename: string;
    amount: number;
    type: string;
    dateofexpense: string;
    remarks: string;
}

interface Employee {
    empid: number;
    name: string;
    role: string;
    pettycashtotal: number;
    expensespent: number;
    calculatedbalance: number;
}

const ProjectRow = ({
                        project,
                        onChangeHandler,
                        refreshProjects,
                        isExpanded,
                        toggleExpand,
                    }: {
    project: ProjectWithExpensesResponse;
    refreshProjects: () => void;
    onChangeHandler: ()=> void;
    isExpanded: boolean;
    toggleExpand: () => void;
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editedProject, setEditedProject] = useState<Project>({ ...project });
    const [isLoading, setIsLoading] = useState(false);

    //project with expense
    const [expenseList, setExpenseList] = useState(project?.expenses);
    // commented old
    /*const [isExpanded, setIsExpanded] = useState(false);*/
    const [employees, setEmployees] = useState<Employee[]>([]); // 👈 CHANGED: State for employees

    // test edit expense
    //const [editedExpense, setEditedExpense] = useState(project?.expenses);

    const API_BASE_URL = "http://localhost:3000";

    const isFormValid =
        editedProject.projectname.trim() !== "" &&
        editedProject.location.trim() !== "" &&
        editedProject.projectcost > 0 &&
        editedProject.description.trim() !== "" &&
        editedProject.income > 0;

    // 👇 CHANGED: Fetch employees for dropdown
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/employees`);
                if (!response.ok) throw new Error("Failed to fetch employees");

                const data = await response.json();
                setEmployees([...data.employees]);
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };

        fetchEmployees();
    }, []);

    // commented old
    /*const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };*/

    const handleUpdate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${project.projectid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editedProject),
            });

            if (!response.ok) throw new Error("Failed to update project");

            console.log("Updated project:", editedProject);
            toast.success("Project updated successfully");
            setIsEditModalOpen(false);
            refreshProjects();
        } catch (error) {
            console.error("Error updating project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/projects/${project.projectid}`, { method: "DELETE" });

            if (!response.ok) throw new Error("Failed to delete project");

            console.log("Deleted project:", project.projectid);
            toast.success("project deleted successfully");
            setIsDeleteModalOpen(false);
            refreshProjects();
        } catch (error) {
            console.error("Error deleting project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        console.log("handle save: " + JSON.stringify(project));
        const payload = {
            projectid: project?.projectid,
            expenses: expenseList.map(({expensename, empid, amount, type, dateofexpense, remarks}) => ({
                expensename:expensename,
                empid:empid,
                amount: amount,
                type:type,
                dateofexpense: dateofexpense,
                remarks: remarks
            })),
        };
        try {
            await axios.put(`${API_BASE_URL}/api/v1/projectwithexpenses/${project?.projectid}`, payload);
            console.log("Recipe saved successfully!");
            toast.success("Recipe created successfully!");
            //onChangeHandler();
        } catch (error) {
            console.error("Error saving recipe", error);
        }
    };

    const handleDeleteExpense = (index) => {
        const updatedExpenses = [...expenseList];
        updatedExpenses.splice(index, 1);
        setExpenseList(updatedExpenses);
    };

    /*const handleNameChange = (index, name) => {
        const updatedExpenses = [...expenseList];
        const expense = updatedExpenses[index];
        expense.expensename = name;
        // tried bby chatgpt
        // updatedExpenses[index].expensename = name;
        setExpenseList(updatedExpenses);
    };*/

    /*const handleAmountChange = (index, amount) => {
        const updatedExpenses = [...expenseList];
        const expense = updatedExpenses[index];
        expense.amount = amount;
        // tried bby chatgpt
        // updatedExpenses[index].expensename = name;
        setExpenseList(updatedExpenses);
    };*/


    const isRowValid = (expense: any) => {
        return (
            expense.expensename?.trim() &&
            /*(expense.empid !== null && expense.empid !== undefined) &&
            expense.amount > 0 &&
            expense.type?.trim() &&*/
            expense.dateofexpense?.trim()
        );
    };

    const handleAddExpense = () => {
        setExpenseList([...expenseList, {
            expensename: "",
            empid:"",
            amount: 0,
            type:"",
            dateofexpense:"",
            remarks:"",
        }]);
    };

    return (
        <>

            <tr className="hover:bg-gray-50 transition-colors duration-150" onClick={toggleExpand}>
                {/* Project Header - Always Visible */}

                <td className="px-6 py-4 text-base font-medium text-gray-900">
                    <div className="flex items-center gap-x-2"> {/* ✅ CHANGED: make icon + text inline */}
                        <div
                            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                        {project.projectname} {/* ✅ CHANGED: now inside flex container */}
                    </div>
                </td>
                <td className="px-6 py-4 text-base text-gray-600">{project.location}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">{project.description}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{project.projectcost}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{project.income}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{project.pendingamount}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{project.totalexpense}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{project.projectbalance}</td>
                <td className=" bg-yellow-100 px-6 py-4 text-base text-gray-600 min-w-[120px]">
                    <div className="flex gap-4">
                        <button
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                            onClick={() => setIsEditModalOpen(true)}
                            aria-label="Edit project"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>

                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1 rounded-md hover:bg-red-50 cursor-pointer"
                            aria-label="Delete project"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6}> {/* <-- spans all columns */}
                        {/* Expandable Content */}
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                            <div className="p-6 border-t flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white">
                                        <thead>
                                        <tr className="bg-gray-100 border-b">
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Expense Name</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Employee</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Amount</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Type</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Date of Expense</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Remarks</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {expenseList.map((expense, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-4 w-56">
                                                    <input
                                                        type="text"
                                                        value={expense.expensename}
                                                        onChange={(e) => {
                                                            const updatedExpenses = [...expenseList];
                                                            updatedExpenses[index].expensename = e.target.value;
                                                            setExpenseList(updatedExpenses);
                                                        }}
                                                        className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ minWidth: '150px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                                    />
                                                </td>
                                                <td className="py-2 px-4 w-56">
                                                    <select
                                                        value={
                                                            expense.empid === null
                                                                ? "others"
                                                                : expense.empid !== undefined
                                                                    ? String(expense.empid)
                                                                    : ""
                                                        }
                                                        onChange={(e) => {
                                                            const updatedExpenses = [...expenseList];
                                                            const selectedId = e.target.value === "others" ? null : parseInt(e.target.value);
                                                            updatedExpenses[index].empid = selectedId;
                                                            setExpenseList(updatedExpenses);
                                                        }}
                                                        className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{
                                                            minWidth: '150px',
                                                            width: '100%',
                                                            padding: '10px',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '5px'
                                                        }}
                                                    >
                                                        <option value="">Select Employee</option>
                                                        {employees.map((emp) => (
                                                            <option key={emp.empid} value={String(emp.empid)}>
                                                                {emp.employeename}
                                                            </option>
                                                        ))}
                                                        <option value="others">Others</option>
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="number"
                                                        value={expense.amount}
                                                        onChange={(e) => {
                                                            const updatedExpenses = [...expenseList];
                                                            updatedExpenses[index].amount = parseFloat(e.target.value) || 0;
                                                            setExpenseList(updatedExpenses);
                                                        }}
                                                        /*onChange={(e) => handleAmountChange(index, e.target.value)}*/
                                                        className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ minWidth: '150px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                                    />
                                                </td>
                                                <td className="py-2 px-4 w-56">
                                                    <select
                                                        value={expense.type} // CHANGED
                                                        onChange={(e) => {
                                                            const updatedExpenses = [...expenseList];
                                                            updatedExpenses[index].type = e.target.value;
                                                            setExpenseList(updatedExpenses);
                                                        }} // SAME
                                                        className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" // SAME
                                                        style={{ minWidth: '150px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}

                                                    >
                                                        <option value="">Select</option> {/* ADDED */}
                                                        <option value="Designing">Designing</option> {/* ADDED */}
                                                        <option value="Material">Material</option> {/* ADDED */}
                                                        <option value="Transport">Transport</option> {/* ADDED */}
                                                        <option value="Factory Cost">Factory Cost</option> {/* ADDED */}
                                                        <option value="Hardware">Hardware</option> {/* ADDED */}
                                                        <option value="Salary">Salary</option> {/* ADDED */}
                                                        <option value="Travel">Travel</option> {/* ADDED */}
                                                        <option value="Food">Food</option> {/* ADDED */}
                                                        <option value="Miscellaneous">Miscellaneous</option> {/* ADDED */}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4 w-48">
                                                    <div className="w-full min-w-[150px]">
                                                        <DatePicker
                                                            selected={expense.dateofexpense ? new Date(expense.dateofexpense) : new Date()}
                                                            onChange={(date: Date | null) => {
                                                                const formattedDate = (date || new Date()).toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }).replace(",", "");

                                                                const updatedExpenses = [...expenseList];
                                                                updatedExpenses[index].dateofexpense = formattedDate;
                                                                setExpenseList(updatedExpenses);
                                                            }}
                                                            dateFormat="dd MMM yyyy"
                                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="text"
                                                        value={expense.remarks}
                                                        onChange={(e) => {
                                                            const updatedExpenses = [...expenseList];
                                                            updatedExpenses[index].remarks = e.target.value;
                                                            setExpenseList(updatedExpenses);
                                                        }}
                                                        className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ minWidth: '250px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                                    />
                                                </td>
                                                <td className="py-2 px-4">
                                                    <button
                                                        onClick={() => handleDeleteExpense(index)}
                                                        className="text-red-600 hover:text-red-800 cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>

                                    </table>
                                </div>
                                {/* Add Expense button placed right after table */}
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleAddExpense}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                             viewBox="0 0 24 24"
                                             stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Add Expense
                                    </button>
                                </div>

                                {/* Action buttons moved to bottom */}
                                <div className="mt-6 flex justify-center gap-3">
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                                        onClick={() => onChangeHandler()}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!isRowValid}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer`}
                                    >
                                        Update Expense
                                    </button>
                                </div>
                            </div>
                        </div>

                    </td>
                </tr>
            )}

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Project</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <Input
                            type="text"
                            value={editedProject.projectname}
                            onChange={(e) => setEditedProject({ ...editedProject, projectname: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Project Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <Input
                            type="text"
                            value={editedProject.location}
                            onChange={(e) => setEditedProject({ ...editedProject, location: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Location"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Cost (₹)</label>
                        <Input
                            type="text"
                            value={editedProject.projectcost || ""}
                            onChange={(e) =>
                                setEditedProject({ ...editedProject, projectcost: e.target.value ? Number(e.target.value) : 0 })
                            }
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Project Cost"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Input
                            type="text"
                            value={editedProject.description}
                            onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                        <Input
                            type="text"
                            value={editedProject.income || ""}
                            onChange={(e) =>
                                setEditedProject({ ...editedProject, income: e.target.value ? Number(e.target.value) : 0 })
                            }
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Income"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className={`cursor-pointer px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-150 font-medium ${
                            isFormValid
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={handleUpdate}
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? <ClipLoader size={16} color="white" /> : "Save Changes"}
                    </button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Project</h2>
                <p className="text-base text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-medium">{project.projectname}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-150 font-medium cursor-pointer"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? <ClipLoader size={16} color="white" /> : "Delete"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ProjectRow;