import React from "react";

interface ComponentCardProps {
  title: string;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  children: React.ReactNode; // Content to be displayed inside the card
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className="   ">
        <div className="bg-gray-400 w-full p-1">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90 ">
          {title}
        </h3>
        </div>

      </div>

      {/* Card Body */}

    </div>
  );
};

export default ComponentCard;
