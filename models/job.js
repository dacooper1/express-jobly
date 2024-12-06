"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, DatabaseError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
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

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id, company_handle AS "companyHandle", title, salary, equity
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, company_handle AS "companyHandle", title, salary, equity
            FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${handle}`);

    return job;
  }

  static async filter(queryData) {
    const { name, minEmployees, maxEmployees } = queryData;
  
    // Validate inputs
    if (minEmployees !== undefined && maxEmployees !== undefined && minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
    }
  
    // Base query
    let query = `
      SELECT handle,
             name,
             description,
             num_employees AS "numEmployees",
             logo_url AS "logoUrl"
      FROM companies
    `;
  
    const queryParams = [];
    const conditions = [];
  
    // Add conditions dynamically
    if (minEmployees !== undefined) {
      queryParams.push(Number(minEmployees));
      conditions.push(`num_employees >= $${queryParams.length}`);
    }
  
    if (maxEmployees !== undefined) {
      queryParams.push(Number(maxEmployees));
      conditions.push(`num_employees <= $${queryParams.length}`);
    }
  
    if (name && name.trim()) {
      queryParams.push(`%${name.trim()}%`);
      conditions.push(`name ILIKE $${queryParams.length}`);
    }
  
    // Append WHERE clause only if there are conditions
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
  
    try {
      const companyRes = await db.query(query, queryParams);
    
      if (companyRes.rows.length === 0) {
        throw new NotFoundError(
          `No companies found with filters: maxEmployees=${maxEmployees}, name=${name}`
        );
      }
  
      return companyRes.rows;
    
    } catch (err) {
      // Only handle unexpected errors (not NotFoundError or BadRequestError)
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
  
      console.error("Query Execution Error:", err);
      throw new DatabaseError(`Failed to execute query: ${query}, Params: ${queryParams}`);
    }

  }
  
  

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Job;
