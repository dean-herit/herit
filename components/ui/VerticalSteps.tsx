"use client";

import React from "react";
import { Button } from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";

export type VerticalStepProps = {
  className?: string;
  description?: React.ReactNode;
  title?: React.ReactNode;
};

export interface VerticalStepsProps {
  /**
   * An array of steps.
   */
  steps?: VerticalStepProps[];
  /**
   * The current step index.
   */
  currentStep?: number;
  /**
   * The default step index.
   */
  defaultStep?: number;
  /**
   * Whether to hide the progress bars.
   */
  hideProgressBars?: boolean;
  /**
   * The custom class for the steps wrapper.
   */
  className?: string;
  /**
   * The custom class for the step.
   */
  stepClassName?: string;
  /**
   * Callback function when the step index changes.
   */
  onStepChange?: (stepIndex: number) => void;
  /**
   * Array indicating which steps are clickable.
   */
  clickableSteps?: boolean[];
}

export function VerticalSteps({
  steps = [],
  defaultStep = 0,
  onStepChange,
  currentStep: currentStepProp,
  hideProgressBars = false,
  stepClassName,
  className,
  clickableSteps = [],
}: VerticalStepsProps) {
  const [currentStep, setCurrentStep] = React.useState(
    currentStepProp ?? defaultStep,
  );

  React.useEffect(() => {
    if (currentStepProp !== undefined) {
      setCurrentStep(currentStepProp);
    }
  }, [currentStepProp]);

  const handleStepClick = (stepIndex: number) => {
    const isClickable = clickableSteps[stepIndex] !== false; // Default to true if not specified

    if (isClickable) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  return (
    <nav aria-label="Progress" className="max-w-fit">
      <ol className={cn("flex flex-col", className)}>
        {steps?.map((step, stepIdx) => {
          const status =
            currentStep === stepIdx
              ? "active"
              : currentStep < stepIdx
                ? "inactive"
                : "complete";

          const isClickable = clickableSteps[stepIdx] !== false; // Default to true if not specified

          return (
            <li key={stepIdx} className="relative flex">
              {/* Step circle column */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    "relative flex h-[34px] w-[34px] items-center justify-center rounded-full font-semibold border-2 text-sm transition-all duration-200 z-10 bg-white",
                    {
                      "bg-primary border-primary text-white shadow-lg":
                        status === "complete",
                      "bg-transparent border-primary text-primary":
                        status === "active",
                      "bg-transparent border-default-300 text-default-400":
                        status === "inactive",
                    },
                    {
                      "opacity-50": !isClickable && status === "inactive",
                    },
                  )}
                  data-status={status}
                >
                  <div className="flex items-center justify-center">
                    {status === "complete" ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span>{stepIdx + 1}</span>
                    )}
                  </div>
                </div>
                {/* Connecting line - extends to next circle */}
                {stepIdx < steps.length - 1 && !hideProgressBars && (
                  <div
                    className={cn("w-0.5 transition-colors duration-200", {
                      "bg-primary": stepIdx < currentStep,
                      "bg-default-300": stepIdx >= currentStep,
                    })}
                    style={{ height: "36px" }}
                  />
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 ml-4">
                <Button
                  className={cn(
                    "group rounded-large flex w-full items-center justify-start gap-0 px-3 py-2.5 h-auto",
                    {
                      "cursor-pointer": isClickable,
                      "cursor-not-allowed opacity-60": !isClickable,
                    },
                    stepClassName,
                  )}
                  isDisabled={!isClickable}
                  variant="light"
                  onPress={() => handleStepClick(stepIdx)}
                >
                  <div className="flex-1 text-left">
                    <div>
                      <div
                        className={cn(
                          "font-medium transition-colors duration-200 text-sm",
                          {
                            "text-foreground":
                              status === "active" || status === "complete",
                            "text-default-400": status === "inactive",
                          },
                          {
                            "opacity-50": !isClickable && status === "inactive",
                          },
                        )}
                      >
                        {step.title}
                      </div>
                      <div
                        className={cn(
                          "text-xs transition-colors duration-200 mt-1",
                          {
                            "text-default-600":
                              status === "active" || status === "complete",
                            "text-default-400": status === "inactive",
                          },
                          {
                            "opacity-50": !isClickable && status === "inactive",
                          },
                        )}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
