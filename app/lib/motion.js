// app/lib/motion.js
export const slideVariants = {
  enter: ({ direction, width }) => ({
    x: direction > 0 ? width : -width,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: ({ direction, width }) => ({
    x: direction > 0 ? -width : width,
    opacity: 0,
  }),
};
