import { initialize, mswDecorator } from "msw-storybook-addon";
import "../app/globals.css";

// Initialize MSW
initialize();

export const decorators = [mswDecorator];

export const parameters = {
  controls: { expanded: true },
  actions: { argTypesRegex: "^on[A-Z].*" },
  nextjs: {
    appDirectory: true,
  },
  backgrounds: {
    default: "light",
    values: [
      {
        name: "light",
        value: "#ffffff",
      },
      {
        name: "dark",
        value: "#1a202c",
      },
    ],
  },
};
