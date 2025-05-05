export type Project = {
    projectid: number;
    projectname: string;
    location: string;
    projectcost: number;
    description: string;
    income: number;
    totalexpense: number;
    pendingamount: number;
    projectbalance: number;
};

export type Expense = {
    // expenseid: number;
    // projectid: number | null;
    empid: number | null;
    // projectname: string;
    employeename: string;
    expensename: string;
    amount: number;
    type: string;
    dateofexpense: string;
    remarks: string;
};

interface Employee {
    empid: number;
    name: string;
    role: string;
    pettycashtotal: number;
    expensespent: number;
    calculatedbalance: number;
}

interface Pettycash {
    pettycashid: number;
    empid: number;
    pettycash: number;
    dateofpettycash: string;
}

interface Amountreceived {
    amountreceivedid: number;
    projectid: number;
    amountreceived: number;
    dateofamountreceived: string;
    remarks: string;
}

export type EmployeeWithPettycashResponse = Employee & {
    pettycash: Pettycash[];
};

export type ProjectWithExpensesResponse = Project & {
    expenses: Expense[];
    amountreceived: Amountreceived[];
};

// Pagination type
export type Pagination = {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
};

// Complete response type
export type FullProjectResponse = {
    projects: ProjectWithExpensesResponse[];
    pagination: Pagination;
    search?: string;
    filteredByExpenses?: string[];
};

export type DropDownResponse = {
    id: string | null;
    name: string;
}

// Complete response type
export type FullEmployeeResponse = {
    employees: EmployeeWithPettycashResponse[];
    pagination: Pagination;
    search?: string;
    filteredByExpenses?: string[];
};