"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, DatabaseError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
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
      console.log("Query:", query);
      console.log("Query Params:", queryParams);
    
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


module.exports = Company;
