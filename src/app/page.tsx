"use client";

import { useState } from "react";
import { Tab } from "@headlessui/react";
import Employees from "@/components/Employees/Employees";
import Projects from "@/components/Projects/Projects";
import { Toaster } from "react-hot-toast";
import Expenses from "@/components/Expenses/Expenses";
import OfficeExpenses from "@/components/OfficeExpenses/OfficeExpenses";

const tabs = ["Employees", "Projects", "Expenses", "OfficeExpenses"];

const HomePage = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="header-bg-color py-4 shadow-md">
          <div className="container mx-auto flex justify-center items-center px-4">
            <div className="flex items-center space-x-2">
              <img src="/images/logo/vanilogo_new.png" alt="Brand Logo" className="header-icon" />
              <h1 className="text-xl font-bold header-text-color">Vista Homes </h1>
            </div>
          </div>
        </header>
        <main className="w-full  flex-1">
          <Toaster position="top-right" reverseOrder={false} />
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex border-b">
              {tabs.map((tab, index) => (
                  <Tab
                      key={index}
                      className={({ selected }) =>
                          `flex-1 py-2 text-center font-medium cursor-pointer ${
                              selected ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
                          }`
                      }
                  >
                    {tab}
                  </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <Employees />
              </Tab.Panel>
              <Tab.Panel>
                <Projects />
              </Tab.Panel>
              <Tab.Panel>
                <Expenses />
              </Tab.Panel>
              <Tab.Panel>
                <OfficeExpenses />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-gray-100 py-3 shadow-md z-10">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-center">
            <div className="flex items-center">
              <img
                  src="/images/logo/creator/brandzon_logo.png"
                  alt="Brandzon Digital Logo"
                  className="h-8 mr-2"
              />
              <span className="text-gray-600">Powered by <span className={"font-bold text-sky-600"}>BRANDZON DIGITAL</span></span>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default HomePage;