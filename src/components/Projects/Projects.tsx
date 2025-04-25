"use client";
import React, {useEffect, useState, useRef} from "react";
import ProjectRow from "@/components/ProjectRow/ProjectRow";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import {Input} from "@headlessui/react";
import toast from "react-hot-toast";
import {DropDownResponse, FullProjectResponse} from "@/types/types";
import Select from 'react-select';
import axios from 'axios';

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


interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/* old response
 interface ProjectsResponse {
    projects: Project[];
    pagination: Pagination;
}*/

const Projects = () => {
    // temp checking FullRecipeResponse
    const [projectsAdd, setProjectsAdd] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [search, setSearch] = useState<string>("");
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [projects, setProjects] = useState<FullProjectResponse>();
    const [employees, setEmployees] = useState<DropDownResponse[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<DropDownResponse[]>([]);
    const [locations, setLocations] = useState<DropDownResponse[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<DropDownResponse[]>([]);
    const [types, setTypes] = useState<DropDownResponse[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<DropDownResponse[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        projectname: "",
        location: "",
        projectcost: "",
        description: "",
        income: "",
    });
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const [isAddProjectFormValid, setIsAddProjectFormValid] = useState(false);

    //control toggle expand
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

    const toggleProjectExpand = (projectid: number) => {
        setExpandedProjectId(prev => (prev === projectid ? null : projectid));
    };

    const totalProjectCost = projects?.projects.reduce((sum, project) => {
        if (project && project.projectcost) {
            return sum + project.projectcost;
        }
        return sum;
    }, 0);

    const totalAmountPaid = projects?.projects.reduce((sum, project) => {
        if (project && project.income) {
            return sum + project.income;
        }
        return sum;
    }, 0);

    const totalAmountPending = projects?.projects.reduce((sum, project) => {
        if (project && project.pendingamount) {
            return sum + project.pendingamount;
        }
        return sum;
    }, 0);

    const totalExpense = projects?.projects.reduce((sum, project) => {
        if (project && project.totalexpense) {
            return sum + project.totalexpense;
        }
        return sum;
    }, 0);

    const totalProjectBalance = projects?.projects.reduce((sum, project) => {
        if (project && project.projectbalance) {
            return sum + project.projectbalance;
        }
        return sum;
    }, 0);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        fetchTypes();
    }, []);

    useEffect(() => {
        setIsAddProjectFormValid(
            !!newProject.projectname &&
            !!newProject.location &&
            !!newProject.projectcost &&
            !!Number(newProject.income)
        );
    }, [newProject]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const fetchProjects = async () => {
                try {
                    setIsLoading(true);
                    //const employeeIds = selectedEmployees.map(employee => employee.id).join(',');
                    const employeeIds = selectedEmployees
                        .map(employee => employee.id === null ? 'null' : employee.id)
                        .join(',');
                    const locationIds = selectedLocations.map(location => location.id).join(',');
                    const typeIds = selectedTypes.map(type => type.id).join(',');
                    console.log(selectedEmployees);
                    console.log("test empids:");
                    console.log(employeeIds);
                    const response = await fetch(
                        `/api/v1/projectsget?page=${page}&limit=${limit}&search=${search}&employeeIds=${employeeIds}&locationIds=${locationIds}&typeIds=${typeIds}`
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data: FullProjectResponse = await response.json();
                    setProjects(data);
                    setPagination(data.pagination);
                    setError(null);
                } catch (err) {
                    console.error("Error fetching projects:", err);
                    setError("Failed to load projects. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchProjects();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [page, search, shouldRefresh, selectedEmployees,selectedLocations, selectedTypes]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    // Function to Add New Project
    const handleAddProject = async () => {
        setIsAdding(true);
        setAddError(null);

        try {
            setIsLoading(true);
            const response = await fetch("/api/v1/projects", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    projectname: newProject.projectname,
                    location: newProject.location,
                    projectcost: parseFloat(newProject.projectcost),
                    description: newProject.description,
                    income: parseFloat(newProject.income),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setProjectsAdd((prev) => [...prev, data.project]); // Add new Project to the list
            toast.success("project added successfully");
            setIsModalOpen(false); // Close modal
            setNewProject({projectname: "", location: "", projectcost: "", description: "", income: ""}); // Reset form
        } catch (err) {
            console.error("Error adding project:", err);
            setAddError("Failed to add project. Please try again.");
        } finally {
            setIsAdding(false);
            refreshProjects();
        }
    };

    const refreshProjects = () => {
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

    const handleLocationsChange = (selectedOptions: { value: string; label: string }[]) => {
        if (!selectedOptions) {
            setSelectedLocations([]);
            return;
        }
        console.log("selectedOptions:", selectedOptions);
        const mapped = selectedOptions.map(option => ({
            id: option.value,
            name: option.label
        }));
        console.log("Selected Locations:", mapped);
        setSelectedLocations(mapped);
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

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/dropdown/employees');
            console.log("Employees API response", response.data.employees);
            setEmployees(response.data.employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/dropdown/locations');
            console.log("Locations API response", response.data.locations);
            setLocations(response.data.locations);
        } catch (error) {
            console.error('Error fetching locations:', error);
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
                            placeholder="Search projects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border rounded shadow-sm mb-4"
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <Select
                            isMulti
                            options={employees.map(employee => ({value: employee.id, label: employee.name}))}
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
                            options={locations.map(location => ({value: location.id, label: location.name}))}
                            value={selectedLocations.map(location => ({
                                value: location.id,
                                label: location.name
                            }))}
                            onChange={handleLocationsChange} // Use new handler instead
                            placeholder="Select Location"
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
                </div>

                {projects?.projects.length === 0 ? (
                    <p className="text-gray-500">No projects found.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                        <table className=" min-w-full table-auto border-collapse divide-y divide-gray-200 ">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Pending</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expense</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Balance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {projects?.projects.map((project) => (
                                <ProjectRow key={project.projectid} project={project}
                                            isExpanded={expandedProjectId === project.projectid}
                                            toggleExpand={() => toggleProjectExpand(project.projectid)}
                                            onChangeHandler={refreshProjects} refreshProjects={() => {
                                    console.log("Refresh projects...");
                                    refreshProjects();
                                }}/>
                            ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="px-6 py-3 text-right font-semibold" colSpan={3}>Total:</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalProjectCost}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalAmountPaid}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalAmountPending}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalExpense}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalProjectBalance}</td>
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
                            Add Project
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
                    <h2 className="text-xl font-bold mb-4">Add Project</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <Input
                                type="text"
                                value={newProject.projectname}
                                onChange={(e) => setNewProject({...newProject, projectname: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newProject.projectname.trim() && (
                                <p className="text-red-500 text-sm mt-1">Name is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <Input
                                type="text"
                                value={newProject.location}
                                onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newProject.location.trim() && (
                                <p className="text-red-500 text-sm mt-1">Location is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Cost</label>
                            <Input
                                type="text"
                                value={newProject.projectcost}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                                    setNewProject({...newProject, projectcost: numericValue});
                                }}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newProject.projectcost.trim() && (
                                <p className="text-red-500 text-sm mt-1">Project Cost is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <Input
                                type="text"
                                value={newProject.description}
                                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                            <Input
                                type="text"
                                value={newProject.income}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                                    setNewProject({...newProject, income: numericValue});
                                }}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newProject.income.trim() && (
                                <p className="text-red-500 text-sm mt-1">Amount Paid is required</p>
                            )}
                        </div>
                        {/* Buttons - Centered */}
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
                                /*onClick={() => setIsModalOpen(false)}*/
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewProject({projectname: "", location: "", projectcost: "", description: "", income: ""}); // Reset form
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className={`px-4 py-2 rounded ${
                                    isAdding || !isAddProjectFormValid ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-500 text-white cursor-pointer"
                                }`}
                                onClick={handleAddProject}
                                disabled={isAdding || !isAddProjectFormValid}
                            >
                                {isAdding ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>)}
        </div>
    );
};

export default Projects;