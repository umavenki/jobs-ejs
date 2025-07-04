const Job = require("../models/Job");
const { seed_db, testUserPassword, factory } = require("../util/seed_db");
const get_chai = require("../util/get_chai");
const { app } = require("../app");

describe("CRUD operations", function () {
  before(async function () {
    try {
      const { expect, request } = await get_chai();
      this.test_user = await seed_db();

      const res1 = await request.execute(app).get("/session/logon").send();

      console.log("GET /session/logon response HTML:", res1.text);
      console.log(
        "Cookies from GET /session/logon:",
        res1.headers["set-cookie"]
      );

      const csrfMatch = res1.text.match(/name="_csrf" value="(.+?)"/);
      if (!csrfMatch) throw new Error("CSRF token not found in form HTML");
      this._csrf = csrfMatch[1];

      const cookies1 = res1.headers["set-cookie"];
      this.csrfCookie = cookies1.find((c) => c.startsWith("_csrf"));
      this.sessionCookie = cookies1.find((c) => c.startsWith("connect.sid"));
      if (!this.sessionCookie || !this.csrfCookie) {
        throw new Error("Required cookies (_csrf or connect.sid) missing");
      }

      this.cookieHeader = `${this.csrfCookie}; ${this.sessionCookie}`;

      const dataToPost = {
        email: this.test_user.email,
        password: testUserPassword,
        _csrf: this._csrf,
      };

      const res2 = await request
        .execute(app)
        .post("/session/logon")
        .set("Cookie", this.cookieHeader)
        .set("content-type", "application/x-www-form-urlencoded")
        .redirects(0)
        .send(dataToPost);

      const cookies2 = res2.headers["set-cookie"];
      this.sessionCookie = cookies2.find((c) => c.startsWith("connect.sid"));
      this.cookieHeader = `${this.csrfCookie}; ${this.sessionCookie}`;

      expect(this._csrf).to.not.be.undefined;
      expect(this.sessionCookie).to.not.be.undefined;
    } catch (err) {
      console.error(" Error in before() hook:", err);
      throw err; // re-throw so Mocha still fails the test
    }
  });

  it("should get the job list with 20 entries", async function () {
    const { expect, request } = await get_chai();

    const res = await request
      .execute(app)
      .get("/jobs")
      .set("Cookie", this.cookieHeader)
      .send();

    console.log("Jobs page response:", res.text);

    expect(res).to.have.status(200);
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21); // 1 header row + 20 jobs
  });

  it("should add a new job", async function () {
    const { expect, request } = await get_chai();

    const newJob = await factory.build("job");
    const dataToPost = {
      company: newJob.company,
      position: newJob.position,
      status: newJob.status,
      _csrf: this._csrf,
    };

    const res = await request
      .execute(app)
      .post("/jobs")
      .set("Cookie", this.cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(302);

    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21);
  });
});
