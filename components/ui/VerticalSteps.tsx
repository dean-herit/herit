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
}

export function VerticalSteps({
  steps = [],
  defaultStep = 0,
  onStepChange,
  currentStep: currentStepProp,
  hideProgressBars = false,
  stepClassName,
  className,
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
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  return (
    <nav aria-label="Progress" className="max-w-fit">
      <ol className={cn("flex flex-col gap-y-3", className)}>
        {steps?.map((step, stepIdx) => {
          const status =
            currentStep === stepIdx
              ? "active"
              : currentStep < stepIdx
                ? "inactive"
                : "complete";

          return (
            <li key={stepIdx} className="relative">
              <div className="flex w-full max-w-full items-center">
                <Button
                  className={cn(
                    "group rounded-large flex w-full cursor-pointer items-center justify-start gap-4 px-3 py-2.5 h-auto",
                    stepClassName,
                  )}
                  variant="light"
                  onPress={() => handleStepClick(stepIdx)}
                >
                  <div className="flex h-full items-center">
                    <div className="relative">
                      <div
                        className={cn(
                          "relative flex h-[34px] w-[34px] items-center justify-center rounded-full font-semibold border-2 text-sm transition-all duration-200",
                          {
                            "bg-primary border-primary text-white shadow-lg":
                              status === "complete",
                            "bg-transparent border-primary text-primary":
                              status === "active",
                            "bg-transparent border-default-300 text-default-400":
                              status === "inactive",
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
                    </div>
                  </div>
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
                        )}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
              {stepIdx < steps.length - 1 && !hideProgressBars && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-[52px] flex h-6 items-center px-4"
                >
                  <div
                    className={cn(
                      "relative h-full w-0.5 transition-colors duration-200",
                      {
                        "bg-primary": stepIdx < currentStep,
                        "bg-default-300": stepIdx >= currentStep,
                      },
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
