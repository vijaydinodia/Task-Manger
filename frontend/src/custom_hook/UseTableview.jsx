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
        ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20 dark:bg-teal-500"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:bg-teal-950/40 dark:hover:text-white"
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
