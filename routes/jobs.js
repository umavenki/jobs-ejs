const express = require("express");
// const controller = require("../controllers/jobs");
const router = express.Router();

const {
  getAllJobs,
  getJob,
  createJob,
  editJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

// router.route("/").post(createJob).get(getAllJobs);
// router
//   .route("/:id")
//   .get(getJob)
//   .delete(deleteJob)
//   .patch(updateJob)
//   .get(editJob);

// List all jobs
router.get("/", getAllJobs);

// Show form to create a new job
router.get("/new", (req, res) =>
  res.render("job", { job: null, csrfToken: res.locals._csrf })
);

// Create a new job
router.post("/", createJob);

// Show form to edit an existing job
router.get("/edit/:id", editJob);

// Update an existing job
router.post("/update/:id", updateJob);

// Delete a job
router.post("/delete/:id", deleteJob);

module.exports = router;
