import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import { Input } from "@headlessui/react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker"; // 👈 CHANGED: Import DatePicker
import "react-datepicker/dist/react-datepicker.css";

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


interface Employee { // 👈 CHANGED: Define Employee interface
    empid: number;
    employeename: string;
}

interface Project { // 👈 CHANGED: Define Project interface
    projectid: number;
    projectname: string;
}

const ExpenseRow = ({
                        expense,
                        refreshExpenses,
                    }: {
    expense: Expense;
    refreshExpenses: () => void;
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editedExpense, setEditedExpense] = useState<Expense>({ ...expense });
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]); // 👈 CHANGED: State for employees
    const [projects, setProjects] = useState<Project[]>([]); // 👈 CHANGED: State for projects

    const API_BASE_URL = "http://localhost:3000";

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

    // 👇 CHANGED: Fetch projects for dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/projects`);
                if (!response.ok) throw new Error("Failed to fetch projects");

                const data = await response.json();
                setProjects([...data.projects]);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };

        fetchProjects();
    }, []);

    const isFormValid =
        (editedExpense.projectid === null || editedExpense.projectid > 0) &&
        (editedExpense.empid === null || editedExpense.empid > 0) &&
        (editedExpense.projectname?.trim() !== "" || "") &&
        (editedExpense.employeename?.trim() !== "" || "") &&
        editedExpense.amount > 0 &&
        (editedExpense.type?.trim() !== "" || "") &&
        (editedExpense.dateofexpense?.trim() !== "" || "") &&
        (editedExpense.remarks?.trim() !== "" || "");

    const handleUpdate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/expenses/${expense.expenseid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editedExpense),
            });

            if (!response.ok) throw new Error("Failed to update expense");

            console.log("Updated expense:", editedExpense);
            toast.success("Expense updated successfully");
            setIsEditModalOpen(false);
            refreshExpenses();
        } catch (error) {
            console.error("Error updating expense:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/expenses/${expense.expenseid}`, { method: "DELETE" });

            if (!response.ok) throw new Error("Failed to delete expense");

            console.log("Deleted expense:", expense.expenseid);
            toast.success("expense deleted successfully");
            setIsDeleteModalOpen(false);
            refreshExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 text-base font-medium text-gray-900">{expense.expensename}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-900">{expense.projectname || "Others"}</td>
                <td className="px-6 py-4 text-base text-gray-600">{expense.employeename || "Others"}</td>
                <td className="px-6 py-4 text-base text-gray-600">₹{expense.amount}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">{expense.type}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">{expense.dateofexpense}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">{expense.remarks}</td>
                <td className="px-6 py-4 text-base text-gray-600">
                    <div className="flex gap-4">
                        <button
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                            onClick={() => setIsEditModalOpen(true)}
                            aria-label="Edit expense"
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
                            aria-label="Delete expense"
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

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Expense</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
                        <Input
                            type="text"
                            value={editedExpense.expensename}
                            onChange={(e) => setEditedExpense({ ...editedExpense, expensename: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Expense Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editedExpense.projectid === null ? "others" : editedExpense.projectid ?? ""} // 🟢 FIXED: Show 'Others' correctly
                            onChange={(e) => {
                                const selectedId = e.target.value === "others" ? null : parseInt(e.target.value);
                                setEditedExpense({
                                    ...editedExpense,
                                    projectid: selectedId,
                                });
                            }}
                        >
                            <option value="">Select Project</option>
                            {projects.map((project) => (
                                <option key={project.projectid} value={project.projectid}>
                                    {project.projectname}
                                </option>
                            ))}
                            <option value="others">Others</option> {/* 🟢 FIXED: Correctly represent "Others" */}
                        </select>

                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editedExpense.empid === null ? "others" : editedExpense.empid ?? ""} // 🟢 FIXED: Show 'Others' correctly
                            onChange={(e) => {
                                const selectedId = e.target.value === "others" ? null : parseInt(e.target.value);
                                setEditedExpense({
                                    ...editedExpense,
                                    empid: selectedId,
                                });
                            }}
                        >
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                                <option key={emp.empid} value={emp.empid}>
                                    {emp.employeename}
                                </option>
                            ))}
                            <option value="others">Others</option> {/* 🟢 FIXED: Correctly represent "Others" */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <Input
                            type="text"
                            value={editedExpense.amount || ""}
                            onChange={(e) =>
                                setEditedExpense({ ...editedExpense, amount: e.target.value ? Number(e.target.value) : 0 })
                            }
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Amount"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <Input
                            type="text"
                            value={editedExpense.type}
                            onChange={(e) => setEditedExpense({ ...editedExpense, type: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Expense</label>
                        <DatePicker
                            selected={editedExpense.dateofexpense ? new Date(editedExpense.dateofexpense) : new Date()} // Handle null date
                            onChange={(date: Date | null) => {
                                if (date) {
                                    setEditedExpense({
                                        ...editedExpense,
                                        dateofexpense: date.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }).replace(",", ""), // Ensures format like 16-Mar-2025
                                    });
                                } else {
                                    // If null, set the current date (or another fallback if preferred)
                                    setEditedExpense({
                                        ...editedExpense,
                                        dateofexpense: new Date().toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }).replace(",", ""),
                                    });
                                }
                            }}
                            dateFormat="dd-MMM-yyyy"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <Input
                            type="text"
                            value={editedExpense.remarks}
                            onChange={(e) => setEditedExpense({ ...editedExpense, remarks: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Remarks"
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
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Expensee</h2>
                <p className="text-base text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-medium">{expense.expenseid}</span>? This action cannot be undone.
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

export default ExpenseRow;