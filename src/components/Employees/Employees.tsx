"use client";
import React, {useEffect, useState, useRef} from "react";
import EmployeeRow from "@/components/EmployeeRow/EmployeeRow";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import {Input} from "@headlessui/react";
import toast from "react-hot-toast";
import {DropDownResponse, FullEmployeeResponse} from "@/types/types";
import Select from "react-select";
import axios from 'axios';

interface Employee {
    empid: number;
    name: string;
    role: string;
    totalamountgiven: number;
    expensespent: number;
    calculatedbalance: number;
}

interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/* old response
interface EmployeesResponse {
    employees: Employee[];
    pagination: Pagination;
}}*/

const Employees = () => {
    const [employeesAdd, setEmployeesAdd] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [search, setSearch] = useState<string>("");
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1)
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [employees, setEmployees] = useState<FullEmployeeResponse>();

    const [roles, setRoles] = useState<DropDownResponse[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<DropDownResponse[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        role: "",
    });
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const [isAddEmployeeFormValid, setIsAddEmployeeFormValid] = useState(false);

    const totalPettyCash = employees?.employees.reduce((sum, employee) => {
        if (employee && employee.pettycashtotal) {
            return sum + employee.pettycashtotal;
        }
        return sum;
    }, 0);

    const totalExpenseSpent = employees?.employees.reduce((sum, employee) => {
        if (employee && employee.expensespent) {
            return sum + employee.expensespent;
        }
        return sum;
    }, 0);

    const totalBalance = employees?.employees.reduce((sum, employee) => {
        if (employee && employee.calculatedbalance) {
            return sum + employee.calculatedbalance;
        }
        return sum;
    }, 0);

    //control toggle expand
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);

    const toggleEmployeeExpand = (empid: number) => {
        setExpandedEmployeeId(prev => (prev === empid ? null : empid));
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        setIsAddEmployeeFormValid(
            !!newEmployee.name &&
            !!newEmployee.role
        );
    }, [newEmployee]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const fetchEmployees = async () => {
                try {
                    setIsLoading(true);
                    const roleIds = selectedRoles.map(role => role.id).join(',');
                    const response = await fetch(
                        `/api/v1/employeesget?page=${page}&limit=${limit}&search=${search}&roleIds=${roleIds}`
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data: FullEmployeeResponse = await response.json();
                    setEmployees(data);
                    setPagination(data.pagination);
                    setError(null);
                } catch (err) {
                    console.error("Error fetching employees:", err);
                    setError("Failed to load employees. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchEmployees();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [page, search, shouldRefresh, selectedRoles]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    // Function to Add New Employee
    const handleAddEmployee = async () => {
        setIsAdding(true);
        setAddError(null);

        try {
            setIsLoading(true);
            const response = await fetch("/api/v1/employees", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: newEmployee.name,
                    role: newEmployee.role,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data   = await response.json();
            console.log("test data");
            console.log(data);
            setEmployeesAdd((prev) => [...prev, data.employee]); // Add new ingredient to the list
            toast.success("employee added successfully");
            setIsModalOpen(false); // Close modal
            setNewEmployee({name: "", role: ""}); // Reset form
        } catch (err) {
            console.error("Error adding employee:", err);
            setAddError("Failed to add employee. Please try again.");
        } finally {
            setIsAdding(false);
            refreshEmployees();
        }
    };

    const refreshEmployees = () => {
        setShouldRefresh(prevShouldRefresh => !prevShouldRefresh);
    };

    const handleRolesChange = (selectedOptions: { value: string; label: string }[]) => {
        if (!selectedOptions) {
            setSelectedRoles([]);
            return;
        }
        console.log("selectedOptions:", selectedOptions);
        const mapped = selectedOptions.map(option => ({
            id: option.value,
            name: option.label
        }));
        console.log("Selected Roles:", mapped);
        setSelectedRoles(mapped);
        setCurrentPage(1);
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/dropdown/roles');
            console.log("Locations API response", response.data.roles);
            setRoles(response.data.roles);
        } catch (error) {
            console.error('Error fetching Roles:', error);
        } finally {
        }
    };

    return (
        <div>{isLoading ? (<div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50">
            <ClipLoader size={75} color={"#4A90E2"} loading={isLoading}/>
        </div>) : (
            <div className="container mx-auto px-4 py-8">
                {/*<div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border rounded shadow-sm mb-4"
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <Select
                            isMulti
                            options={roles.map(role => ({value: role.id, label: role.name}))}
                            value={selectedRoles.map(role => ({
                                value: role.id,
                                label: role.name
                            }))}
                            onChange={handleRolesChange} // Use new handler instead
                            placeholder="Select Role"
                        />
                    </div>
                </div>*/}

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            // className="w-full px-4 py-2 border rounded shadow-sm" // Removed mb-4
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Select
                            isMulti
                            options={roles.map(role => ({ value: role.id, label: role.name }))}
                            value={selectedRoles.map(role => ({
                                value: role.id,
                                label: role.name
                            }))}
                            onChange={handleRolesChange}
                            placeholder="Select Role"
                        />
                    </div>
                </div>

                {employees?.employees.length === 0 ? (
                    <p className="text-gray-500">No employees found.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employee Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Petty Cash</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Expense Spent</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Balance</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {employees?.employees.map((employee) => (
                                <EmployeeRow key={employee.empid} employeeWithPettyCash={employee}
                                             isExpanded={expandedEmployeeId === employee.empid}
                                             toggleExpand={() => toggleEmployeeExpand(employee.empid)}
                                             onChangeHandler={refreshEmployees} refreshEmployees={() => {
                                    console.log("Refresh employees...");
                                    refreshEmployees();
                                }}/>
                            ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="px-6 py-3 text-right font-semibold" colSpan={2}>Total:</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalPettyCash}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalExpenseSpent}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalBalance}</td>
                                </tr>
                            </tfoot>
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
                            Add Employee
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
                    <h2 className="text-xl font-bold mb-4">Add Employee</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <Input
                                type="text"
                                placeholder="Name"
                                value={newEmployee.name}
                                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newEmployee.name.trim() && (
                                <p className="text-red-500 text-sm mt-1">Name is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <Input
                                type="text"
                                placeholder="Role"
                                value={newEmployee.role}
                                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newEmployee.role.trim() && (
                                <p className="text-red-500 text-sm mt-1">Role is required</p>
                            )}
                        </div>
                    </div>
                    {/* Buttons - Centered */}
                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
                            /*onClick={() => setIsModalOpen(false)}*/
                            onClick={() => {
                                setIsModalOpen(false);
                                setNewEmployee({name: "", role: ""});
                            }}

                        >
                            Cancel
                        </button>

                        <button
                            className={`px-4 py-2 rounded ${
                                isAdding || !isAddEmployeeFormValid ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-500 text-white cursor-pointer"
                            }`}
                            onClick={handleAddEmployee}
                            disabled={isAdding || !isAddEmployeeFormValid}
                        >
                            {isAdding ? "Adding..." : "Add"}
                        </button>
                    </div>
                </Modal>
            </div>)}
        </div>
    );
};

export default Employees;
