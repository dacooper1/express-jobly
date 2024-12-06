"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, DatabaseError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { companyHandle, title, salary, equity }
   *
   * Returns { id, companyHandle, title, salary, equity  }
   *
   * Throws BadRequestError if companyHandle is not in database.
   * */

  static async create({ companyHandle, title, salary, equity }) {
    const companyCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [companyHandle]);

    if (!companyCheck.rows[0])
      throw new BadRequestError(`Company is not in database: ${companyHandle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (company_handle, title, salary, equity)
           VALUES ($1, $2, $3, $4)
           RETURNING id, company_handle AS "companyHandle", title, salary, equity`,
        [
          companyHandle,
          title,
          salary,
          equity
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, company_handle, salary, equity }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id, company_handle AS "companyHandle", title, salary, equity
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }


  /** Given a job id, return data about job.
   *
   * Returns { id, title, company_handle, salary, equity }
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, company_handle AS "companyHandle", title, salary, equity
            FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async filter(queryData) {
    const { title, minSalary, hasEquity } = queryData;
  
      // Validate inputs
    if (minSalary !== undefined && minSalary < 0) {
      throw new BadRequestError("minSalary cannot be less than 0");
    }

    // Base query
    let query = `
      SELECT id, 
            company_handle AS "companyHandle", 
            title, 
            salary, 
            equity
      FROM jobs
    `;

    const queryParams = [];
    const conditions = [];

    // Add conditions dynamically
    if (minSalary !== undefined) {
      queryParams.push(Number(minSalary));
      conditions.push(`salary >= $${queryParams.length}`);
    }

    if (hasEquity === "true" || hasEquity === true) {
      // Only add equity condition if hasEquity is explicitly true
      conditions.push(`equity > 0`);
    }

    if (title && title.trim()) {
      queryParams.push(`%${title.trim()}%`);
      conditions.push(`title ILIKE $${queryParams.length}`);
    }

    // Combine conditions into the query
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY title";
  
    try {
      const jobRes = await db.query(query, queryParams);
    
      if (jobRes.rows.length === 0) {
        throw new NotFoundError(
          `No jobs found with filters`
        );
      }
  
      return jobRes.rows;
    
    } catch (err) {
      // Only handle unexpected errors (not NotFoundError or BadRequestError)
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
  
      console.error("Query Execution Error:", err);
      throw new DatabaseError(`Failed to execute query: ${query}, Params: ${queryParams}`);
    }

  }
  
  

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {salary, equity}
   * id, companyHandle, and title cannot be changed
   *
   * Returns {id, title, companyHandle, salary, equity}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          equity: "equity",
          salary: "salary",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                title,
                                company_handle AS "companyHandle", 
                                salary,
                                equity
                                `;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; 
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title, company_handle AS "companyHandle"`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
