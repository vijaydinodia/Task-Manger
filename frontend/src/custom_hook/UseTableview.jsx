import { useState } from "react";

const useTableview = (defaultView = "card") => {
  const [view, setView] = useState(defaultView);

  const isTableView = view === "table";
  const isCardView = view === "card";

  const showTableView = () => setView("table");
  const showCardView = () => setView("card");
  const toggleView = () => setView((prev) => (prev === "table" ? "card" : "table"));

  const viewButtonClass = (targetView) =>
    `rounded-lg px-3 py-2 text-sm font-semibold ${
      view === targetView
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
    }`;

  return {
    view,
    isTableView,
    isCardView,
    setView,
    showTableView,
    showCardView,
    toggleView,
    viewButtonClass,
  };
};

export default useTableview;
