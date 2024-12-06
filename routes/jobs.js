"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin} = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * company should be { companyHandle, title, salary, equity }
 *
 * Returns { companyHandle, title, salary, equity }
 *
 * Authorization required: Admin 
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { companyHandle, title, salary, equity }, ...] }
 *
 * Can filter on provided search filters:
 * - hasEquity
 * - minSalary
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
      const validFilters = ["minSalary", "hasEquity", "title"];
      const filters = req.query;
  
      // Step 1: Validate query keys
      const filterKeys = Object.keys(filters);
      for (const filter of filterKeys) {
        if (!validFilters.includes(filter)) {
          throw new BadRequestError(`Invalid filter: ${filter}`);
        }
      }
  
      // Step 2: Validate data types
      if (filters.minSalary !== undefined) {
        if (isNaN(Number(filters.minSalary))) {
          throw new BadRequestError(`Invalid type for minSalary: must be a number`);
        }
      }
  
      if (filters.hasEquity !== undefined) {
        if (filters.hasEquity !== "true" && filters.hasEquity !== "false") {
          throw new BadRequestError(`Invalid type for hasEquity: must be "true" or "false"`);
        }
      }
  
      // Step 3: Fetch jobs based on filters or fetch all jobs
      if (filterKeys.length === 0) {
        const jobs = await Job.findAll();
        return res.json({ jobs });
      } else {
        const jobs = await Job.filter(filters);
        return res.json({ jobs });
      }
    } catch (err) {
      return next(err);
    }
  });
  

/** GET /[id]  =>  { job }
 *
 * job is { id, title, salary, equity }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { salary, equity }
 *
 * Returns { id, title, company_handle AS "companyHandle", salary, equity}
 *
 * Authorization required: Admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: Admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
