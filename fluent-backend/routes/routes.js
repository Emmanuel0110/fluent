import conversationRoutes from "./conversationRoutes";
import reviewItemsRoutes from "./reviewControlers";
import tagRoutes from "./tagControlers";
import userRoutes from "./userControlers";
import userCourseRoutes from "./userCourseControlers";
import wordRoutes from "./wordControlers";



import express from "express";
const router = express.Router();

router.use("/api/conversations", conversationRoutes);
router.use("/api/reviewItem", reviewItemsRoutes);
router.use("/api/tags", tagRoutes);
router.use("/api/users", userRoutes);
router.use("/api/usercourses", userCourseRoutes);
router.use("/api/words", wordRoutes);
router.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = router;