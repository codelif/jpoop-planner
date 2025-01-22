
/**
 * General Motion Variants used for day-to-day sliding animations.
 */
export const slideVariants = {
  enter: (direction) => ({
    position: "absolute",
    width: "100%",
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    position: "relative",
    width: "100%",
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    position: "absolute",
    width: "100%",
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
}
