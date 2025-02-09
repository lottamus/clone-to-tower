export const logger = {
  debug: (...message: unknown[]) => {
    if (import.meta.env.VITE_IS_DEV) {
      console.log("[clone-in-tower]", ...message);
    }
  },

  error: (...message: unknown[]) => {
    if (import.meta.env.VITE_IS_DEV) {
      console.error("[clone-in-tower]", ...message);
    }
  },
};
