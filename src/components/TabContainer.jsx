import { useLocation } from "react-router-dom";

export default function TabContainer({ currentPath, children }) {
  const tabConfigs = [
    { path: "/", label: "Home" },
    { path: "/training", label: "Training" },
    { path: "/techniques", label: "Matrix" },
    { path: "/blueprint", label: "Blueprint" },
  ];

  return (
    <div className="relative flex-1 overflow-hidden">
      {tabConfigs.map((tab) => (
        <div
          key={tab.path}
          className={`absolute inset-0 overflow-auto transition-opacity duration-200 ${
            currentPath === tab.path ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {children(tab.path)}
        </div>
      ))}
    </div>
  );
}