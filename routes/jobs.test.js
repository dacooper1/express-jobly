"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token

} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", () => {
    test("works for admin", async () => {
      const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "c1",
          title: "new-job",
          salary: 120000,
          equity: 0.1,
        })
        .set("Authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "new-job",
          salary: 120000,
          equity: "0.1",
        },
      });
    });
  
    test("unauth for non-admin", async () => {
      const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "test-handle",
          title: "new-job",
          salary: 120000,
          equity: 0.1,
        })
        .set("Authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toBe(401);
    });
  
    test("bad request with missing data", async () => {
      const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "test-handle",
        })
        .set("Authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toBe(400);
    });
  
    test("bad request with invalid data", async () => {
      const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "test-handle",
          title: "new-job",
          salary: "not-a-number",
          equity: 0.1,
        })
        .set("Authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toBe(400);
    });
  });
  
  /************************************** GET /companies */

  describe("GET /jobs", () => {
    test("works: no filters", async () => {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs: [
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "test-job1",
                salary: 100,
                equity: "0.1",
            },
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "test-job2",
                salary: 200,
                equity: "0.2",
            },
            {
                id: expect.any(Number),
                companyHandle: "c3",
                title: "test-job3",
                salary: null,
                equity: null
            }
        ],
      });
    });
  
    test("works: with filters", async () => {
      const resp = await request(app)
        .get("/jobs")
        .query({ minSalary: 200, hasEquity: true });
      expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            companyHandle: "c2",
            title: "test-job2",
            salary: 200,
            equity: "0.2",
          },
        ],
      });
    });
  
    test("bad request with invalid filter", async () => {
      const resp = await request(app).get("/jobs").query({ minSalary: "not-a-number" });
      expect(resp.statusCode).toBe(400);
    });
  });
  