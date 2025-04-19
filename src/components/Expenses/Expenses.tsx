"use client";
import React, {useEffect, useState, useRef} from "react";
import ExpenseRow from "@/components/ExpenseRow/ExpenseRow";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import {Input} from "@headlessui/react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker"; // 👈 CHANGED: Import DatePicker
import "react-datepicker/dist/react-datepicker.css";
import {DropDownResponse} from "@/types/types";
import axios from "axios";
import Select from "react-select";

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

interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ExpensesResponse {
    expenses: Expense[];
    pagination: Pagination;
}

const Expenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [search, setSearch] = useState<string>("");
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [employeesFilter, setEmployeesFilter] = useState<DropDownResponse[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<DropDownResponse[]>([]);
    const [types, setTypes] = useState<DropDownResponse[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<DropDownResponse[]>([]);

    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        projectid: "",
        empid: "",
        expensename: "",
        amount: "",
        type: "",
        dateofexpense: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).replace(",", ""),
        remarks: "",
    });
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]); // 👈 CHANGED: State for employees
    const [projects, setProjects] = useState<Project[]>([]); // 👈 CHANGED: State for projects

    //date filter
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;

    const API_BASE_URL = "http://localhost:3000";

    useEffect(() => {
        fetchDropdownEmployees();
    }, []);

    useEffect(() => {
        fetchTypes();
    }, []);

    // 👇 CHANGED: Fetch employees for grid dropdown
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

    // 👇 CHANGED: Fetch projects for grid dropdown
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

    const [isAddExpenseFormValid, setIsAddExpenseFormValid] = useState(false);

    useEffect(() => {
        setIsAddExpenseFormValid(
            !!newExpense.projectid &&
            !!newExpense.empid &&
            !!newExpense.expensename &&
            !!Number(newExpense.amount) &&
            !!newExpense.type &&
            !!newExpense.dateofexpense
        );
    }, [newExpense]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const fetchExpenses = async () => {
                try {
                    setIsLoading(true);

                    // 🔹 Convert to backend-compatible format: "19 Apr 2025"
                    /*const formatDate = (date: Date | null) => {
                        return date
                            ? date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }).replace(",", "")
                            : "";
                    };*/

                    /*const formatDate = (date: Date | null) => {
                        return date
                            ? date.toISOString().split("T")[0] // outputs "2025-04-01"
                            : "";
                    };*/

                    const formatDate = (date: Date | null) => {
                        if (!date) return "";

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");

                        return `${year}-${month}-${day}`; // e.g., "2025-04-16"
                    };

                    const formattedStartDate = formatDate(startDate);
                    const formattedEndDate = formatDate(endDate);

                    const employeeIds = selectedEmployees.map(employee => employee.id).join(',');
                    const typeIds = selectedTypes.map(type => type.id).join(',');
                    const response = await fetch(
                        `/api/v1/expensesget?page=${page}&limit=${limit}&search=${search}&employeeIds=${employeeIds}&typeIds=${typeIds}`+
                        (formattedStartDate ? `&startDate=${formattedStartDate}` : "") +
                        (formattedEndDate ? `&endDate=${formattedEndDate}` : "")
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data: ExpensesResponse = await response.json();
                    setExpenses(data.expenses);
                    setPagination(data.pagination);
                    setError(null);
                } catch (err) {
                    console.error("Error fetching expenses:", err);
                    setError("Failed to load expenses. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchExpenses();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [page, search, shouldRefresh, selectedEmployees, selectedTypes, dateRange]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    // Function to Add New Expense
    const handleAddExpense = async () => {
        setIsAdding(true);
        setAddError(null);

        try {
            setIsLoading(true);
            const response = await fetch("/api/v1/expenses", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    projectid: newExpense.projectid === "Others" ? null : parseInt(newExpense.projectid),
                    empid: newExpense.empid === "Others" ? null : parseInt(newExpense.empid),
                    expensename: newExpense.expensename,
                    amount: parseFloat(newExpense.amount),
                    type: newExpense.type,
                    dateofexpense: newExpense.dateofexpense,
                    remarks: newExpense.remarks,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setExpenses((prev) => [...prev, data.expense]); // Add new expense to the list
            toast.success("expense added successfully");
            setIsModalOpen(false); // Close modal
            setNewExpense({
                projectid: "",
                empid: "",
                expensename: "",
                amount: "",
                type: "",
                dateofexpense: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }).replace(",", ""),
                remarks: ""
            }); // Reset form
        } catch (err) {
            console.error("Error adding expense:", err);
            setAddError("Failed to add expense. Please try again.");
        } finally {
            setIsAdding(false);
            refreshExpenses();
        }
    };

    const refreshExpenses = () => {
        setShouldRefresh(prevShouldRefresh => !prevShouldRefresh);
    };

    const handleEmployeesChange = (selectedOptions: { value: string; label: string }[]) => {
        if (!selectedOptions) {
            setSelectedEmployees([]);
            return;
        }
        console.log("selectedOptions:", selectedOptions);
        const mapped = selectedOptions.map(option => ({
            id: option.value,
            name: option.label
        }));
        console.log("Selected employees:", mapped);
        setSelectedEmployees(mapped);
        setCurrentPage(1);
    };

    const handleTypesChange = (selectedOptions: { value: string; label: string }[]) => {
        if (!selectedOptions) {
            setSelectedTypes([]);
            return;
        }
        console.log("selectedOptions:", selectedOptions);
        const mapped = selectedOptions.map(option => ({
            id: option.value,
            name: option.label
        }));
        console.log("Selected Locations:", mapped);
        setSelectedTypes(mapped);
        setCurrentPage(1);
    };


    //Fetch projects for filter dropdown
    const fetchDropdownEmployees = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/dropdown/employees');
            console.log("Employees API response", response.data.employees);
            setEmployeesFilter(response.data.employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
        }
    };

    const fetchTypes = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/dropdown/types');
            console.log("Locations API response", response.data.types);
            setTypes(response.data.types);
        } catch (error) {
            console.error('Error fetching Types:', error);
        } finally {
        }
    };

    return (
        <div>{isLoading ? (<div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50">
            <ClipLoader size={75} color={"#4A90E2"} loading={isLoading}/>
        </div>) : (
            <div className="container mx-auto px-4 py-8">
                <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search expenses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border rounded shadow-sm mb-4"
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <Select
                            isMulti
                            options={employeesFilter.map(employee => ({value: employee.id, label: employee.name}))}
                            value={selectedEmployees.map(employee => ({
                                value: employee.id,
                                label: employee.name
                            }))}
                            onChange={handleEmployeesChange} // Use new handler instead
                            placeholder="Select Employee"
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <Select
                            isMulti
                            options={types.map(type => ({value: type.id, label: type.name}))}
                            value={selectedTypes.map(type => ({
                                value: type.id,
                                label: type.name
                            }))}
                            onChange={handleTypesChange} // Use new handler instead
                            placeholder="Select Types"
                        />
                    </div>
                    <div className="w-full sm:flex-1">
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update: [Date | null, Date | null]) => {
                                setDateRange(update);
                                setPage(1); // reset page on filter change
                            }}
                            isClearable
                            placeholderText="Filter by date range"
                            dateFormat="dd MMM yyyy"   // ✅ SHOW date as "19 Apr 2025"
                            className="w-full px-4 py-2 border rounded"
                        />
                    </div>
                </div>

                {expenses.length === 0 ? (
                    <p className="text-gray-500">No expenses found.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Expense</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>

                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map((expense) => (
                                <ExpenseRow key={expense.expenseid} expense={expense} refreshExpenses={() => {
                                    console.log("Refresh expense...");
                                    refreshExpenses();
                                }}/>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => {
                                setIsModalOpen(true)
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4
                    rounded-md transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Expense
                        </button>
                    </div>
                )}

                {pagination && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </button>
                        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-xl font-bold mb-4">Add Expenses</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
                            <Input
                                type="text"
                                placeholder="ExpenseName"
                                value={newExpense.expensename}
                                onChange={(e) => setNewExpense({...newExpense, expensename: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                            {/* Project Dropdown */}
                            <select
                                value={newExpense.projectid}
                                onChange={(e) => setNewExpense({ ...newExpense, projectid: e.target.value || null })}
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            >
                                <option value="">Select Project</option>
                                {projects.map((project) => (
                                    <option key={project.projectid} value={project.projectid}>
                                        {project.projectname}
                                    </option>
                                ))}
                                <option value={null}>Others</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                            {/* Employee Dropdown */}
                            <select
                                value={newExpense.empid}
                                onChange={(e) => setNewExpense({ ...newExpense, empid: e.target.value || null })}
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            >
                                <option value="">Select Employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.empid} value={employee.empid}>
                                        {employee.employeename}
                                    </option>
                                ))}
                                <option value={null}>Others</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <Input
                                type="text"
                                value={newExpense.amount}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                                    setNewExpense({ ...newExpense, amount: numericValue });
                                }}
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                            <select
                                value={newExpense.type}
                                onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            >
                                <option value="">Select Expense Type</option>
                                <option value="Designing">Designing</option>
                                <option value="Material">Material</option>
                                <option value="Transport">Transport</option>
                                <option value="Factory Cost">Factory Cost</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Salary">Salary</option>
                                <option value="Travel">Travel</option>
                                <option value="Food">Food</option>
                                <option value="Miscellaneous">Miscellaneous</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Expense</label>
                            <DatePicker
                                selected={newExpense.dateofexpense ? new Date(newExpense.dateofexpense) : new Date()}
                                onChange={(date: Date | null) => {
                                    if (date) {
                                        setNewExpense({
                                            ...newExpense,
                                            dateofexpense: date.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }).replace(",", ""),
                                        });
                                    }
                                }}
                                dateFormat="dd MMM yyyy"
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <Input
                                type="text"
                                placeholder="Remarks"
                                value={newExpense.remarks}
                                onChange={(e) => setNewExpense({...newExpense, remarks: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        {/* Buttons - Centered */}
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className={`px-4 py-2 rounded ${
                                    isAdding || !isAddExpenseFormValid ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-500 text-white cursor-pointer"
                                }`}
                                onClick={handleAddExpense}
                                disabled={isAdding || !isAddExpenseFormValid}
                            >
                                {isAdding ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>)}</div>
    );
};

export default Expenses;