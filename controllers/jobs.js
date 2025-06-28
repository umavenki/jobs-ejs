const Job = require("../models/Job");
const { StatusCodes } = require("http-status-codes");
const crsf = require("host-csrf");

const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id });
  const token = crsf.token(req, res);
  res.render("jobs", { jobs, _csrf: token });
  //   res.send("Get all jobs");
};
const getJob = async (req, res) => {
  const token = crsf.token(req, res);
  res.render("job", { job: null, _csrf: token });
  //   res.send("Get Single job");
};
const createJob = async (req, res) => {
  const { company, position, status } = req.body;
  try {
    // const token = crsf.token(req, res);
    await Job.create({
      company,
      position,
      status,
      createdBy: req.user._id,
    });
    res.redirect("/jobs");
  } catch (err) {
    res.send("Failed to create job err:" + err);
  }

  //   req.body.createdBy = req.user.userId;
  //   const job = await Job.create(req.body);
  //   res.status(StatusCodes.CREATED).json({ job });
};
const editJob = async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  console.log("editJob :"+JSON.stringify(job));
  if (!job) return res.send("Job not found");
  //res.render("job", { job });
  res.render("job", { job, _csrf: res.locals._csrf });
};
const updateJob = async (req, res) => {
  const { company, position, status } = req.body;
  console.log("updateJob :"+JSON.stringify(req.body));
  await Job.updateOne(
    { _id: req.params.id, createdBy: req.user._id },
    { company, position, status }
  );
  res.redirect("/jobs");
  //   res.send("Update job");
};
const deleteJob = async (req, res) => {
  await Job.deleteOne({ _id: req.params.id, createdBy: req.user._id });
  res.redirect("/jobs");
  //   res.send("Delete job");
};
module.exports = {
  getAllJobs,
  getJob,
  createJob,
  editJob,
  updateJob,
  deleteJob,
};
